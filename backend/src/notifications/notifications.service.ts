import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';
import * as webpush from 'web-push';

import { DeviceToken, DevicePlatform } from './entities/device-token.entity';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseReady = false;

  constructor(
    @InjectRepository(DeviceToken) private readonly tokens: Repository<DeviceToken>,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    this.initFirebase();
    this.initWebPush();
  }

  private initFirebase() {
    const credJson = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!credJson) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT_JSON não configurado — FCM desativado');
      return;
    }
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(credJson)) });
    }
    this.firebaseReady = true;
  }

  private initWebPush() {
    const pub = this.config.get<string>('VAPID_PUBLIC_KEY');
    const priv = this.config.get<string>('VAPID_PRIVATE_KEY');
    const email = this.config.get<string>('VAPID_EMAIL', 'mailto:contato@sentido.app');
    if (!pub || !priv) {
      this.logger.warn('VAPID keys não configuradas — Web Push desativado');
      return;
    }
    webpush.setVapidDetails(email, pub, priv);
  }

  // Registrar token de um dispositivo
  async registerToken(userId: string, platform: DevicePlatform, token: string) {
    const existing = await this.tokens.findOne({ where: { userId, token } });
    if (existing) {
      existing.isActive = true;
      return this.tokens.save(existing);
    }
    return this.tokens.save(this.tokens.create({ userId, platform, token }));
  }

  // Desativar token (logout do dispositivo)
  async deactivateToken(userId: string, token: string) {
    await this.tokens.update({ userId, token }, { isActive: false });
  }

  // Enviar push para todos os dispositivos ativos de um usuário
  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    const devices = await this.tokens.find({ where: { userId, isActive: true } });
    await Promise.allSettled(devices.map((d) => this.sendToDevice(d, payload)));
  }

  private async sendToDevice(device: DeviceToken, payload: PushPayload) {
    try {
      if (device.platform === DevicePlatform.WEB) {
        await this.sendWebPush(device.token, payload);
      } else {
        await this.sendFcm(device.token, payload, device.platform);
      }
      await this.tokens.update(device.id, { lastUsedAt: new Date() });
    } catch (err: any) {
      this.logger.warn(`Push falhou para token ${device.id}: ${err.message}`);
      // Desativa tokens inválidos/expirados
      if (this.isInvalidTokenError(err)) {
        await this.tokens.update(device.id, { isActive: false });
      }
    }
  }

  private async sendFcm(token: string, payload: PushPayload, platform: DevicePlatform) {
    if (!this.firebaseReady) return;
    await admin.messaging().send({
      token,
      notification: { title: payload.title, body: payload.body },
      data: payload.data,
      android: platform === DevicePlatform.ANDROID
        ? { priority: 'high', notification: { sound: 'default' } }
        : undefined,
      apns: platform === DevicePlatform.IOS
        ? { payload: { aps: { sound: 'default', badge: 1 } } }
        : undefined,
    });
  }

  private async sendWebPush(subscription: string, payload: PushPayload) {
    const sub = JSON.parse(subscription) as webpush.PushSubscription;
    await webpush.sendNotification(sub, JSON.stringify({ title: payload.title, body: payload.body, data: payload.data }));
  }

  private isInvalidTokenError(err: any): boolean {
    const msg = err?.errorInfo?.code ?? err?.message ?? '';
    return (
      msg.includes('registration-token-not-registered') ||
      msg.includes('invalid-registration-token') ||
      msg.includes('InvalidRegistration') ||
      err?.statusCode === 410
    );
  }
}
