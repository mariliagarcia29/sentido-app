import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  ClinicalObservation,
  ObservationSeverity,
  ObservationTrigger,
} from './entities/clinical-observation.entity';
import { CreateObservationDto } from './dto/create-observation.dto';
import { ConsentService } from '../consent/consent.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ObservationsService {
  constructor(
    @InjectRepository(ClinicalObservation)
    private readonly obs: Repository<ClinicalObservation>,
    private readonly consent: ConsentService,
    private readonly push: NotificationsService,
  ) {}

  async createByDoctor(doctorId: string, dto: CreateObservationDto) {
    await this.consent.assertConsent(doctorId, dto.patientId);
    const record = await this.obs.save(
      this.obs.create({
        doctorId,
        patientId: dto.patientId,
        content: dto.content,
        severity: dto.severity ?? ObservationSeverity.INFO,
        triggeredBy: ObservationTrigger.DOCTOR,
      }),
    );
    // Notifica paciente imediatamente
    this.push.sendToUser(dto.patientId, {
      title: '💬 Nova observação médica',
      body: dto.content.slice(0, 100),
      data: { type: 'clinical_observation', observationId: record.id },
    }).catch(() => {});
    return record;
  }

  async createBySystem(patientId: string, content: string, severity: ObservationSeverity) {
    const record = await this.obs.save(
      this.obs.create({ patientId, content, severity, triggeredBy: ObservationTrigger.SYSTEM }),
    );
    // Push apenas para alertas warn e critical
    if (severity !== ObservationSeverity.INFO) {
      const emoji = severity === ObservationSeverity.CRITICAL ? '🚨' : '⚠️';
      this.push.sendToUser(patientId, {
        title: `${emoji} Alerta de saúde`,
        body: content.slice(0, 100),
        data: { type: 'system_alert', observationId: record.id, severity },
      }).catch(() => {});
    }
    return record;
  }

  async getForPatient(doctorId: string, patientId: string) {
    await this.consent.assertConsent(doctorId, patientId);
    return this.obs.find({ where: { patientId }, order: { createdAt: 'DESC' } });
  }

  getMine(patientId: string) {
    return this.obs.find({ where: { patientId }, relations: ['doctor'], order: { createdAt: 'DESC' } });
  }

  async markRead(id: string, patientId: string) {
    const record = await this.obs.findOne({ where: { id, patientId } });
    if (!record) throw new NotFoundException('Observação não encontrada');
    record.isRead = true;
    return this.obs.save(record);
  }

  countUnread(patientId: string) {
    return this.obs.count({ where: { patientId, isRead: false } });
  }
}
