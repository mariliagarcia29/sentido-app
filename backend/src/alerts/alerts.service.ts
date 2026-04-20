import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';

import { MoodEntry } from '../records/entities/mood-entry.entity';
import { MedicationRecord } from '../records/entities/medication-record.entity';
import { Severity } from '../records/entities/symptom-record.entity';
import { WearableData, WearableDataType } from '../wearables/entities/wearable-data.entity';
import { ObservationsService } from '../observations/observations.service';
import { ObservationSeverity } from '../observations/entities/clinical-observation.entity';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(MoodEntry) private readonly moods: Repository<MoodEntry>,
    @InjectRepository(MedicationRecord) private readonly medications: Repository<MedicationRecord>,
    @InjectRepository(WearableData) private readonly wearableData: Repository<WearableData>,
    private readonly observations: ObservationsService,
  ) {}

  // Chamado após cada registro de humor — janela de 7 dias
  async checkMoodAnomaly(userId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const recent = await this.moods.find({
      where: { userId, createdAt: MoreThan(since) as any },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    if (recent.length < 3) return;

    const allLow = recent.every((m) => m.score <= 2);
    if (allLow) {
      await this.observations.createBySystem(
        userId,
        `Alerta automático: humor consistentemente baixo nos últimos ${recent.length} registros nos últimos 7 dias (score ≤ 2). Avaliação recomendada.`,
        ObservationSeverity.WARN,
      );
    }

    const allCritical = recent.slice(0, 3).every((m) => m.score === 1);
    if (allCritical) {
      await this.observations.createBySystem(
        userId,
        'Alerta crítico: humor mínimo (score 1) registrado três vezes consecutivas. Atenção urgente recomendada.',
        ObservationSeverity.CRITICAL,
      );
    }
  }

  // Chamado após cada registro de medicação não tomada — janela de 3 dias
  async checkMedicationMissed(userId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 3);

    const missed = await this.medications.find({
      where: { userId, taken: false, createdAt: MoreThan(since) as any },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    if (missed.length >= 3) {
      await this.observations.createBySystem(
        userId,
        `Alerta: ${missed.length} medicações não tomadas nos últimos 3 dias. Adesão ao tratamento comprometida.`,
        ObservationSeverity.WARN,
      );
    }
  }

  // Chamado após registro de sintoma grave
  async checkCriticalSymptom(userId: string, symptom: string, severity: Severity) {
    if (severity === Severity.HIGH) {
      await this.observations.createBySystem(
        userId,
        `Alerta: sintoma grave registrado — "${symptom}". Avaliação médica recomendada.`,
        ObservationSeverity.WARN,
      );
    }
  }

  // Chamado após sincronização de wearable com dado de frequência cardíaca
  // Detecta FC > 100 bpm (taquicardia em repouso) conforme plano Topic 10
  async checkHeartRateAnomaly(userId: string, bpm: number) {
    if (bpm <= 100) return;

    // Verifica leituras elevadas nos últimos 3 dias para avaliar severidade
    const since = new Date();
    since.setDate(since.getDate() - 3);

    const recentHighCount = await this.wearableData.count({
      where: {
        userId,
        dataType: WearableDataType.HEART_RATE,
        recordedAt: MoreThan(since) as any,
      },
    });

    // Leitura única elevada → WARN; padrão sustentado (≥2 leituras nos últimos 3 dias) → CRITICAL
    const severity = recentHighCount >= 2 ? ObservationSeverity.CRITICAL : ObservationSeverity.WARN;

    await this.observations.createBySystem(
      userId,
      severity === ObservationSeverity.CRITICAL
        ? `Alerta crítico: frequência cardíaca elevada em repouso (${bpm} bpm) detectada por múltiplos dias consecutivos. Avaliação cardiológica recomendada.`
        : `Alerta: frequência cardíaca em repouso elevada (${bpm} bpm > 100 bpm). Monitorar e consultar médico se persistir.`,
      severity,
    );
  }
}
