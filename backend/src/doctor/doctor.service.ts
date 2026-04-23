import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MoodEntry } from '../records/entities/mood-entry.entity';
import { SymptomRecord, Severity } from '../records/entities/symptom-record.entity';
import { MedicationRecord } from '../records/entities/medication-record.entity';
import { ConsentService } from '../consent/consent.service';
import { AuditLog } from '../common/entities/audit-log.entity';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(MoodEntry) private readonly moods: Repository<MoodEntry>,
    @InjectRepository(SymptomRecord) private readonly symptoms: Repository<SymptomRecord>,
    @InjectRepository(MedicationRecord) private readonly medications: Repository<MedicationRecord>,
    @InjectRepository(AuditLog) private readonly auditLogs: Repository<AuditLog>,
    private readonly consent: ConsentService,
  ) {}

  // Lista todos os pacientes com consentimento ativo
  async listLinkedPatients(doctorId: string) {
    const consents = await this.consent.getMyPatients(doctorId);
    return consents.map((c) => c.patient).filter(Boolean);
  }

  // Humor do paciente (apenas registros não-privados)
  async getPatientMoods(doctorId: string, patientId: string, ip: string) {
    await this.consent.assertConsent(doctorId, patientId);
    await this.log(doctorId, 'READ_PATIENT_MOODS', patientId, ip);
    return this.moods.find({
      where: { userId: patientId, isPrivate: false },
      order: { createdAt: 'DESC' },
      take: 60,
    });
  }

  // Sintomas do paciente (apenas não-privados)
  async getPatientSymptoms(doctorId: string, patientId: string, ip: string) {
    await this.consent.assertConsent(doctorId, patientId);
    await this.log(doctorId, 'READ_PATIENT_SYMPTOMS', patientId, ip);
    return this.symptoms.find({
      where: { userId: patientId, isPrivate: false },
      order: { createdAt: 'DESC' },
      take: 60,
    });
  }

  // Medicações do paciente
  async getPatientMedications(doctorId: string, patientId: string, ip: string) {
    await this.consent.assertConsent(doctorId, patientId);
    await this.log(doctorId, 'READ_PATIENT_MEDICATIONS', patientId, ip);
    return this.medications.find({
      where: { userId: patientId },
      order: { createdAt: 'DESC' },
      take: 60,
    });
  }

  // Médico arquiva prescrição (torna histórico)
  async archiveMedication(doctorId: string, patientId: string, medicationId: string, ip: string) {
    await this.consent.assertConsent(doctorId, patientId);
    const med = await this.medications.findOne({ where: { id: medicationId, userId: patientId, prescribedBy: doctorId } });
    if (!med) throw new Error('Prescrição não encontrada');
    const archivedAt = new Date();
    await this.medications.update(medicationId, { archivedAt });
    await this.log(doctorId, 'ARCHIVE_MEDICATION', medicationId, ip);
    return { ...med, archivedAt };
  }

  // Médico desarquiva prescrição (reativa para uso atual)
  async unarchiveMedication(doctorId: string, patientId: string, medicationId: string, ip: string) {
    await this.consent.assertConsent(doctorId, patientId);
    const med = await this.medications.findOne({ where: { id: medicationId, userId: patientId, prescribedBy: doctorId } });
    if (!med) throw new Error('Prescrição não encontrada');
    await this.medications.update(medicationId, { archivedAt: null as any });
    await this.log(doctorId, 'UNARCHIVE_MEDICATION', medicationId, ip);
    return { ...med, archivedAt: null };
  }

  // Médico prescreve medicamento para paciente
  async prescribeMedication(
    doctorId: string,
    patientId: string,
    data: { name: string; dose?: string },
    ip: string,
  ) {
    await this.consent.assertConsent(doctorId, patientId);
    await this.log(doctorId, 'PRESCRIBE_MEDICATION', patientId, ip);
    const record = this.medications.create({
      userId: patientId,
      prescribedBy: doctorId,
      name: data.name,
      dose: data.dose,
      taken: false,
    });
    return this.medications.save(record);
  }

  // Sumário clínico do paciente (últimos 7 dias)
  async getPatientSummary(doctorId: string, patientId: string, ip: string) {
    const consentRecord = await this.consent.assertConsent(doctorId, patientId);
    await this.log(doctorId, 'READ_PATIENT_SUMMARY', patientId, ip);
    const patient = consentRecord.patient;

    const since = new Date();
    since.setDate(since.getDate() - 7);

    const [moods, symptoms, medications] = await Promise.all([
      this.moods.find({ where: { userId: patientId, isPrivate: false }, order: { createdAt: 'DESC' }, take: 14 }),
      this.symptoms.find({ where: { userId: patientId, isPrivate: false }, order: { createdAt: 'DESC' }, take: 10 }),
      this.medications.find({ where: { userId: patientId }, order: { createdAt: 'DESC' }, take: 10 }),
    ]);

    const avgMood = moods.length
      ? moods.reduce((s, m) => s + m.score, 0) / moods.length
      : null;

    const missedMeds = medications.filter((m) => !m.taken).length;
    const criticalSymptoms = symptoms.filter((s) => s.severity === Severity.HIGH).length;

    // Score de risco simples: humor baixo + medicação perdida + sintomas graves
    const riskScore = Math.min(
      100,
      (avgMood !== null && avgMood < 2.5 ? 30 : 0) +
        missedMeds * 10 +
        criticalSymptoms * 20,
    );

    return { patient, avgMood, missedMeds, criticalSymptoms, riskScore, moods, symptoms, medications };
  }

  private async log(userId: string, action: string, resource: string, ip: string) {
    await this.auditLogs.save(
      this.auditLogs.create({ userId, action, targetResource: resource, ipAddress: ip }),
    );
  }
}
