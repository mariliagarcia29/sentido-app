import { Injectable, Logger, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { WearableData, WearableSource, WearableDataType, WearableSyncStatus } from './entities/wearable-data.entity';
import { WearableConnection } from './entities/wearable-connection.entity';
import { PushWearableDataDto } from './dto/push-wearable-data.dto';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class WearablesService {
  private readonly logger = new Logger(WearablesService.name);

  constructor(
    @InjectRepository(WearableData)
    private readonly data: Repository<WearableData>,
    @InjectRepository(WearableConnection)
    private readonly connections: Repository<WearableConnection>,
    private readonly config: ConfigService,
    private readonly alerts: AlertsService,
  ) {}

  // ── Fitbit OAuth 2.0 ────────────────────────────────────────────────────────

  getFitbitAuthUrl(userId: string): string {
    const clientId = this.config.get('FITBIT_CLIENT_ID', '');
    const redirectUri = encodeURIComponent(this.config.get('FITBIT_REDIRECT_URI', 'http://localhost:3001/api/v1/wearables/fitbit/callback'));
    const scopes = encodeURIComponent('activity heartrate sleep weight profile');
    const state = Buffer.from(userId).toString('base64');
    return `https://www.fitbit.com/oauth2/authorize?client_id=${clientId}&response_type=code&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;
  }

  async fitbitCallback(code: string, state: string): Promise<WearableConnection> {
    const userId = Buffer.from(state, 'base64').toString('utf8');
    const clientId = this.config.get('FITBIT_CLIENT_ID', '');
    const clientSecret = this.config.get('FITBIT_CLIENT_SECRET', '');
    const redirectUri = this.config.get('FITBIT_REDIRECT_URI', 'http://localhost:3001/api/v1/wearables/fitbit/callback');

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, grant_type: 'authorization_code', redirect_uri: redirectUri }).toString(),
    });

    if (!res.ok) throw new BadRequestException('Falha ao autenticar com Fitbit');

    const tokens = await res.json() as {
      access_token: string; refresh_token: string;
      expires_in: number; user_id: string;
    };

    const existing = await this.connections.findOne({ where: { userId, provider: WearableSource.FITBIT } });

    const conn = existing ?? this.connections.create({ userId, provider: WearableSource.FITBIT });
    conn.accessToken = tokens.access_token;
    conn.refreshToken = tokens.refresh_token;
    conn.providerUserId = tokens.user_id;
    conn.tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    conn.isActive = true;
    return this.connections.save(conn);
  }

  // ── Garmin OAuth 1.0a (stub — requer lib oauth-1.0a) ───────────────────────

  getGarminAuthUrl(): string {
    this.logger.warn('Garmin OAuth 1.0a: configuração via GARMIN_CONSUMER_KEY necessária');
    return this.config.get('GARMIN_AUTH_URL', 'https://connect.garmin.com/oauthConfirm');
  }

  // ── Sincronização Fitbit ─────────────────────────────────────────────────────

  async syncFitbit(userId: string): Promise<{ synced: number }> {
    const conn = await this.connections.findOne({ where: { userId, provider: WearableSource.FITBIT, isActive: true } });
    if (!conn) throw new NotFoundException('Conta Fitbit não conectada');

    const token = await this.refreshFitbitTokenIfNeeded(conn);
    const today = new Date().toISOString().slice(0, 10);
    let synced = 0;
    let heartRateBpm: number | null = null;

    await Promise.allSettled([
      this.fetchFitbitActivity(userId, token, today).then((n) => { synced += n; }),
      this.fetchFitbitHeartRate(userId, token, today).then(({ count, bpm }) => {
        synced += count;
        heartRateBpm = bpm;
      }),
      this.fetchFitbitSleep(userId, token, today).then((n) => { synced += n; }),
    ]);

    conn.lastSyncAt = new Date();
    await this.connections.save(conn);

    // Verifica anomalia de FC após sincronização — fire-and-forget
    if (heartRateBpm !== null) {
      this.alerts.checkHeartRateAnomaly(userId, heartRateBpm).catch(() => {});
    }

    return { synced };
  }

  private async refreshFitbitTokenIfNeeded(conn: WearableConnection): Promise<string> {
    const expiresAt = conn.tokenExpiresAt ? conn.tokenExpiresAt.getTime() : 0;
    if (Date.now() < expiresAt - 5 * 60 * 1000) return conn.accessToken;

    const clientId = this.config.get('FITBIT_CLIENT_ID', '');
    const clientSecret = this.config.get('FITBIT_CLIENT_SECRET', '');
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const res = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: conn.refreshToken }).toString(),
    });

    if (!res.ok) { conn.isActive = false; await this.connections.save(conn); throw new BadRequestException('Token Fitbit expirado'); }

    const tokens = await res.json() as { access_token: string; refresh_token: string; expires_in: number };
    conn.accessToken = tokens.access_token;
    conn.refreshToken = tokens.refresh_token;
    conn.tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    await this.connections.save(conn);
    return tokens.access_token;
  }

  private async fetchFitbitActivity(userId: string, token: string, date: string): Promise<number> {
    const res = await fetch(`https://api.fitbit.com/1/user/-/activities/date/${date}.json`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return 0;
    const body = await res.json() as { summary?: { steps?: number; caloriesOut?: number } };
    const records: Partial<WearableData>[] = [];

    if (body.summary?.steps) {
      records.push({ userId, source: WearableSource.FITBIT, dataType: WearableDataType.STEPS, value: body.summary.steps, unit: 'steps', recordedAt: new Date(date), status: WearableSyncStatus.COMPLETE });
    }
    if (body.summary?.caloriesOut) {
      records.push({ userId, source: WearableSource.FITBIT, dataType: WearableDataType.CALORIES, value: body.summary.caloriesOut, unit: 'kcal', recordedAt: new Date(date), status: WearableSyncStatus.COMPLETE });
    }
    if (records.length) await this.data.save(records.map((r) => this.data.create(r)));
    return records.length;
  }

  private async fetchFitbitHeartRate(
    userId: string,
    token: string,
    date: string,
  ): Promise<{ count: number; bpm: number | null }> {
    const res = await fetch(`https://api.fitbit.com/1/user/-/activities/heart/date/${date}/1d.json`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { count: 0, bpm: null };
    const body = await res.json() as { 'activities-heart'?: { value?: { restingHeartRate?: number } }[] };
    const resting = body['activities-heart']?.[0]?.value?.restingHeartRate;
    if (!resting) return { count: 0, bpm: null };
    await this.data.save(this.data.create({
      userId, source: WearableSource.FITBIT, dataType: WearableDataType.HEART_RATE,
      value: resting, unit: 'bpm', recordedAt: new Date(date), status: WearableSyncStatus.COMPLETE,
    }));
    return { count: 1, bpm: resting };
  }

  private async fetchFitbitSleep(userId: string, token: string, date: string): Promise<number> {
    const res = await fetch(`https://api.fitbit.com/1.2/user/-/sleep/date/${date}.json`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return 0;
    const body = await res.json() as { summary?: { totalMinutesAsleep?: number } };
    const minutes = body.summary?.totalMinutesAsleep;
    if (!minutes) return 0;
    await this.data.save(this.data.create({ userId, source: WearableSource.FITBIT, dataType: WearableDataType.SLEEP, value: minutes, unit: 'min', recordedAt: new Date(date), status: WearableSyncStatus.COMPLETE }));
    return 1;
  }

  // ── Garmin Health API Webhook ─────────────────────────────────────────────────

  async handleGarminWebhook(token: string, payload: Record<string, any>): Promise<{ received: number }> {
    const expected = this.config.get<string>('GARMIN_VERIFICATION_TOKEN', '');
    if (!expected || token !== expected) throw new UnauthorizedException('Token Garmin inválido');
    const records: Partial<WearableData>[] = [];
    const heartRateByUser = new Map<string, number>();

    const resolveUserId = async (accessToken: string | undefined): Promise<string | null> => {
      if (!accessToken) return null;
      const conn = await this.connections.findOne({ where: { accessToken, provider: WearableSource.GARMIN, isActive: true } });
      return conn?.userId ?? null;
    };

    const activities: any[] = payload.activitySummaries ?? payload.dailies ?? [];
    for (const act of activities) {
      const userId = await resolveUserId(act.userAccessToken);
      if (!userId) continue;
      const date = act.calendarDate ? new Date(act.calendarDate) : new Date();
      if (act.steps != null) records.push({ userId, source: WearableSource.GARMIN, dataType: WearableDataType.STEPS, value: act.steps, unit: 'steps', recordedAt: date, status: WearableSyncStatus.COMPLETE });
      if (act.activeKilocalories != null) records.push({ userId, source: WearableSource.GARMIN, dataType: WearableDataType.CALORIES, value: act.activeKilocalories, unit: 'kcal', recordedAt: date, status: WearableSyncStatus.COMPLETE });
    }

    const heartRates: any[] = payload.heartRateSummaries ?? [];
    for (const hr of heartRates) {
      const userId = await resolveUserId(hr.userAccessToken);
      if (!userId || hr.restingHeartRateInBeatsPerMinute == null) continue;
      const bpm = hr.restingHeartRateInBeatsPerMinute;
      records.push({ userId, source: WearableSource.GARMIN, dataType: WearableDataType.HEART_RATE, value: bpm, unit: 'bpm', recordedAt: new Date(hr.calendarDate ?? Date.now()), status: WearableSyncStatus.COMPLETE });
      heartRateByUser.set(userId, bpm);
    }

    const sleeps: any[] = payload.sleepSummaries ?? [];
    for (const sl of sleeps) {
      const userId = await resolveUserId(sl.userAccessToken);
      if (!userId || sl.durationInSeconds == null) continue;
      records.push({ userId, source: WearableSource.GARMIN, dataType: WearableDataType.SLEEP, value: Math.round(sl.durationInSeconds / 60), unit: 'min', recordedAt: new Date(sl.calendarDate ?? Date.now()), status: WearableSyncStatus.COMPLETE });
    }

    const bodyComps: any[] = payload.bodyComps ?? [];
    for (const bc of bodyComps) {
      const userId = await resolveUserId(bc.userAccessToken);
      if (!userId || bc.weightInGrams == null) continue;
      records.push({ userId, source: WearableSource.GARMIN, dataType: WearableDataType.WEIGHT, value: bc.weightInGrams / 1000, unit: 'kg', recordedAt: new Date(bc.measurementTimeInSeconds ? bc.measurementTimeInSeconds * 1000 : Date.now()), status: WearableSyncStatus.COMPLETE });
    }

    if (records.length) {
      await this.data.save(records.map((r) => this.data.create(r)));
      const userIds = [...new Set(records.map((r) => r.userId!))];
      for (const userId of userIds) {
        const conn = await this.connections.findOne({ where: { userId, provider: WearableSource.GARMIN } });
        if (conn) { conn.isActive = true; conn.lastSyncAt = new Date(); await this.connections.save(conn); }
        else await this.connections.save(this.connections.create({ userId, provider: WearableSource.GARMIN, isActive: true, lastSyncAt: new Date() }));
      }
    }

    // Verifica anomalia de FC para cada usuário com dado de FC recebido — fire-and-forget
    for (const [userId, bpm] of heartRateByUser) {
      this.alerts.checkHeartRateAnomaly(userId, bpm).catch(() => {});
    }

    this.logger.log(`Garmin webhook: ${records.length} registros processados`);
    return { received: records.length };
  }

  // ── Push manual (mobile envia dados do HealthKit/Health Connect) ─────────────

  async pushData(userId: string, dto: PushWearableDataDto): Promise<WearableData> {
    const record = await this.data.save(this.data.create({
      userId,
      source: dto.source,
      dataType: dto.dataType,
      value: dto.value,
      unit: dto.unit,
      deviceName: dto.deviceName,
      recordedAt: new Date(dto.recordedAt),
      status: WearableSyncStatus.COMPLETE,
    }));

    // Verifica anomalia de FC quando o mobile envia dados de frequência cardíaca
    if (dto.dataType === WearableDataType.HEART_RATE) {
      this.alerts.checkHeartRateAnomaly(userId, dto.value).catch(() => {});
    }

    return record;
  }

  // ── Consultas ─────────────────────────────────────────────────────────────────

  getConnections(userId: string) {
    return this.connections.find({ where: { userId, isActive: true } });
  }

  async disconnect(userId: string, provider: WearableSource) {
    const conn = await this.connections.findOne({ where: { userId, provider } });
    if (conn) { conn.isActive = false; await this.connections.save(conn); }
  }

  getData(userId: string, dataType?: WearableDataType, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const qb = this.data.createQueryBuilder('w')
      .where('w.userId = :userId', { userId })
      .andWhere('w.recordedAt >= :since', { since })
      .orderBy('w.recordedAt', 'DESC');
    if (dataType) qb.andWhere('w.dataType = :dataType', { dataType });
    return qb.take(500).getMany();
  }

  getSummary(userId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    return this.data.createQueryBuilder('w')
      .select('w.dataType', 'dataType')
      .addSelect('MAX(w.value)', 'latest')
      .addSelect('AVG(w.value)', 'avg')
      .addSelect('MAX(w.recordedAt)', 'lastRecordedAt')
      .where('w.userId = :userId', { userId })
      .andWhere('w.recordedAt >= :since', { since })
      .groupBy('w.dataType')
      .getRawMany();
  }
}
