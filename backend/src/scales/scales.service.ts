import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScaleResponse } from './entities/scale-response.entity';
import { PatientScaleConfig } from './entities/patient-scale-config.entity';
import { PatientProfile } from '../profile/entities/patient-profile.entity';
import { CheckIn } from '../checkins/entities/check-in.entity';
import { SubmitScaleResponseDto } from './dto/submit-response.dto';
import { ConfigureScaleDto } from './dto/configure-scale.dto';
import {
  SCALES,
  DEFAULT_FREQUENCY_DAYS,
  computeInterpretation,
  hasCriticalAnswer,
} from './scales.data';
import { ObservationsService } from '../observations/observations.service';
import { ObservationSeverity } from '../observations/entities/clinical-observation.entity';

export interface PendingScale {
  scaleType: string;
  name: string;
  fullName: string;
  description: string;
  questionCount: number;
  trigger: 'scheduled' | 'clinical' | 'diagnosis';
  lastRespondedAt: Date | null;
}

@Injectable()
export class ScalesService {
  constructor(
    @InjectRepository(ScaleResponse)
    private readonly responseRepo: Repository<ScaleResponse>,
    @InjectRepository(PatientScaleConfig)
    private readonly configRepo: Repository<PatientScaleConfig>,
    @InjectRepository(PatientProfile)
    private readonly profileRepo: Repository<PatientProfile>,
    @InjectRepository(CheckIn)
    private readonly checkinRepo: Repository<CheckIn>,
    private readonly observations: ObservationsService,
  ) {}

  getScaleDefinitions() {
    return Object.values(SCALES).map(s => ({
      type: s.type,
      name: s.name,
      fullName: s.fullName,
      description: s.description,
      timeframe: s.timeframe,
      maxScore: s.maxScore,
      higherIsBetter: s.higherIsBetter,
      questionCount: s.questions.length,
      questions: s.questions,
      scoreRanges: s.scoreRanges,
    }));
  }

  getScaleDefinition(scaleType: string) {
    const scale = SCALES[scaleType.toUpperCase()];
    if (!scale) throw new BadRequestException(`Escala '${scaleType}' não encontrada.`);
    return scale;
  }

  async getPendingScales(userId: string): Promise<PendingScale[]> {
    const [profile, responses, configs, recentCheckins] = await Promise.all([
      this.profileRepo.findOne({ where: { userId } }),
      this.responseRepo.find({
        where: { userId },
        order: { respondedAt: 'DESC' },
      }),
      this.configRepo.find({ where: { patientId: userId, isActive: true } }),
      this.checkinRepo.find({
        where: { userId },
        order: { checkinDate: 'DESC' },
        take: 5,
      }),
    ]);

    const hasPregnancy = profile?.currentDiagnoses?.some(d =>
      /gestação|gravidez|gestante|grávida|perinatal|pós-parto|postparto/i.test(d),
    ) ?? false;

    // ISI: gatilho clínico — sono < 5h em 3 noites consecutivas
    const isiClinicalTrigger =
      recentCheckins.length >= 3 &&
      recentCheckins.slice(0, 3).every(c => c.sleepHours != null && c.sleepHours < 5);

    const now = Date.now();
    const pending: PendingScale[] = [];

    for (const scaleType of Object.keys(SCALES)) {
      const config = configs.find(c => c.scaleType === scaleType);

      // Escala desativada explicitamente pelo médico
      if (config && !config.isActive) continue;

      // EPDS só aparece se houver diagnóstico de gestação/pós-parto
      if (scaleType === 'EPDS' && !hasPregnancy) continue;

      const freqDays = config?.frequencyDays ?? DEFAULT_FREQUENCY_DAYS[scaleType];
      const lastResponse = responses.find(r => r.scaleType === scaleType);
      const daysSinceLast = lastResponse
        ? (now - new Date(lastResponse.respondedAt).getTime()) / 86_400_000
        : Infinity;

      const isDueBySchedule = daysSinceLast >= freqDays;
      // ISI: gatilho clínico, mas respeitando janela mínima de 7 dias
      const isDueByClinical =
        scaleType === 'ISI' && isiClinicalTrigger && daysSinceLast >= 7;
      // EPDS: gatilho de diagnóstico, sempre programado
      const isDueByDiagnosis =
        scaleType === 'EPDS' && hasPregnancy && isDueBySchedule;

      if (isDueByClinical || isDueByDiagnosis || isDueBySchedule) {
        const trigger = isDueByClinical
          ? 'clinical'
          : isDueByDiagnosis
          ? 'diagnosis'
          : 'scheduled';

        pending.push({
          scaleType,
          name: SCALES[scaleType].name,
          fullName: SCALES[scaleType].fullName,
          description: SCALES[scaleType].description,
          questionCount: SCALES[scaleType].questions.length,
          trigger,
          lastRespondedAt: lastResponse?.respondedAt ?? null,
        });
      }
    }

    return pending;
  }

  async submitResponse(
    userId: string,
    scaleType: string,
    dto: SubmitScaleResponseDto,
  ): Promise<ScaleResponse> {
    const type = scaleType.toUpperCase();
    const scale = SCALES[type];
    if (!scale) throw new BadRequestException(`Escala '${scaleType}' não encontrada.`);

    if (dto.answers.length !== scale.questions.length) {
      throw new BadRequestException(
        `A escala ${scale.name} requer ${scale.questions.length} respostas; recebidas: ${dto.answers.length}.`,
      );
    }

    const totalScore = dto.answers.reduce((sum, v) => sum + v, 0);
    const interpretation = computeInterpretation(type, totalScore);
    const critical = hasCriticalAnswer(type, dto.answers);

    const response = this.responseRepo.create({
      userId,
      scaleType: type,
      answers: dto.answers,
      totalScore,
      interpretation,
      hasCriticalAnswer: critical,
      triggeredBy: dto.triggeredBy ?? 'patient',
    });

    const saved = await this.responseRepo.save(response);

    // Dispara alerta clínico se houver resposta crítica (ex.: ideação suicida)
    if (critical) {
      const qs = this.getCriticalQuestionNumbers(type, dto.answers).join(', Q');
      this.observations
        .createBySystem(
          userId,
          `Resposta crítica na escala ${scale.name} (Q${qs}). Avaliação de risco recomendada.`,
          ObservationSeverity.CRITICAL,
        )
        .catch(() => {});
    }

    return saved;
  }

  async getResponses(userId: string, scaleType?: string): Promise<ScaleResponse[]> {
    const where: any = { userId };
    if (scaleType) where.scaleType = scaleType.toUpperCase();
    return this.responseRepo.find({ where, order: { respondedAt: 'DESC' }, take: 50 });
  }

  // ─── Doctor ──────────────────────────────────────────────────────────────────

  async getPatientConfigs(doctorId: string, patientId: string): Promise<PatientScaleConfig[]> {
    return this.configRepo.find({ where: { patientId } });
  }

  async configureScale(
    doctorId: string,
    patientId: string,
    dto: ConfigureScaleDto,
  ): Promise<PatientScaleConfig> {
    const type = dto.scaleType.toUpperCase();
    if (!SCALES[type]) throw new BadRequestException(`Escala '${dto.scaleType}' inválida.`);

    let config = await this.configRepo.findOne({
      where: { patientId, scaleType: type },
    });

    if (config) {
      Object.assign(config, {
        doctorId,
        isActive: dto.isActive,
        frequencyDays: dto.frequencyDays ?? null,
        triggerType: dto.triggerType ?? 'scheduled',
      });
    } else {
      config = this.configRepo.create({
        patientId,
        doctorId,
        scaleType: type,
        isActive: dto.isActive,
        frequencyDays: dto.frequencyDays ?? undefined,
        triggerType: dto.triggerType ?? 'scheduled',
      });
    }

    return this.configRepo.save(config);
  }

  async getPatientResponses(
    doctorId: string,
    patientId: string,
    scaleType?: string,
  ): Promise<ScaleResponse[]> {
    const where: any = { userId: patientId };
    if (scaleType) where.scaleType = scaleType.toUpperCase();
    return this.responseRepo.find({ where, order: { respondedAt: 'DESC' }, take: 100 });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private getCriticalQuestionNumbers(scaleType: string, answers: number[]): number[] {
    return SCALES[scaleType].questions
      .filter((q, idx) => q.isCritical && (answers[idx] ?? 0) > 0)
      .map(q => q.id);
  }
}
