import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MoodEntry } from './entities/mood-entry.entity';
import { SymptomRecord } from './entities/symptom-record.entity';
import { MedicationRecord } from './entities/medication-record.entity';
import { CreateMoodDto } from './dto/create-mood.dto';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { AlertsService } from '../alerts/alerts.service';
import { AuditLog } from '../common/entities/audit-log.entity';

@Injectable()
export class RecordsService {
  constructor(
    @InjectRepository(MoodEntry) private readonly moods: Repository<MoodEntry>,
    @InjectRepository(SymptomRecord) private readonly symptoms: Repository<SymptomRecord>,
    @InjectRepository(MedicationRecord) private readonly medications: Repository<MedicationRecord>,
    @InjectRepository(AuditLog) private readonly auditLogs: Repository<AuditLog>,
    private readonly alerts: AlertsService,
  ) {}

  getMoods(userId: string) {
    return this.moods.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 30 });
  }

  async createMood(userId: string, dto: CreateMoodDto, ip = '') {
    const entry = await this.moods.save(this.moods.create({ userId, ...dto }));
    this.alerts.checkMoodAnomaly(userId).catch(() => {});
    this.log(userId, 'CREATE_MOOD', 'mood_entries', ip);
    return entry;
  }

  getSymptoms(userId: string) {
    return this.symptoms.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 50 });
  }

  async createSymptom(userId: string, dto: CreateSymptomDto, ip = '') {
    const entry = await this.symptoms.save(this.symptoms.create({ userId, ...dto }));
    if (dto.severity) {
      this.alerts.checkCriticalSymptom(userId, dto.symptom, dto.severity).catch(() => {});
    }
    this.log(userId, 'CREATE_SYMPTOM', 'symptom_records', ip);
    return entry;
  }

  getMedications(userId: string) {
    return this.medications.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 50 });
  }

  async createMedication(userId: string, dto: CreateMedicationDto, ip = '') {
    const entry = await this.medications.save(this.medications.create({ userId, ...dto }));
    if (dto.taken === false) {
      this.alerts.checkMedicationMissed(userId).catch(() => {});
    }
    this.log(userId, 'CREATE_MEDICATION', 'medication_records', ip);
    return entry;
  }

  // Soft-delete com validação de ownership — dado permanece 15 dias antes da purga física
  async deleteMood(id: string, userId: string, ip = '') {
    const entry = await this.moods.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Registro não encontrado');
    if (entry.userId !== userId) throw new ForbiddenException();
    await this.moods.softDelete(id);
    this.log(userId, 'DELETE_MOOD', `mood_entries:${id}`, ip);
  }

  async deleteSymptom(id: string, userId: string, ip = '') {
    const entry = await this.symptoms.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Registro não encontrado');
    if (entry.userId !== userId) throw new ForbiddenException();
    await this.symptoms.softDelete(id);
    this.log(userId, 'DELETE_SYMPTOM', `symptom_records:${id}`, ip);
  }

  async deleteMedication(id: string, userId: string, ip = '') {
    const entry = await this.medications.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Registro não encontrado');
    if (entry.userId !== userId) throw new ForbiddenException();
    await this.medications.softDelete(id);
    this.log(userId, 'DELETE_MEDICATION', `medication_records:${id}`, ip);
  }

  private log(userId: string, action: string, resource: string, ip: string) {
    this.auditLogs.save(
      this.auditLogs.create({ userId, action, targetResource: resource, ipAddress: ip }),
    ).catch(() => {});
  }
}
