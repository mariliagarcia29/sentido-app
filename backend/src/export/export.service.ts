import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { PdfExport, ExportStatus } from './entities/pdf-export.entity';
import { CreateExportDto } from './dto/create-export.dto';
import { PDF_QUEUE } from './workers/pdf.worker';
import { MoodEntry } from '../records/entities/mood-entry.entity';
import { SymptomRecord } from '../records/entities/symptom-record.entity';
import { MedicationRecord } from '../records/entities/medication-record.entity';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(PdfExport) private readonly exports: Repository<PdfExport>,
    @InjectQueue(PDF_QUEUE) private readonly pdfQueue: Queue,
    @InjectRepository(MoodEntry) private readonly moods: Repository<MoodEntry>,
    @InjectRepository(SymptomRecord) private readonly symptoms: Repository<SymptomRecord>,
    @InjectRepository(MedicationRecord) private readonly medications: Repository<MedicationRecord>,
  ) {}

  async requestExport(userId: string, dto: CreateExportDto) {
    CreateExportDto.validate(dto);
    const record = await this.exports.save(
      this.exports.create({ userId, ...dto }),
    );
    await this.pdfQueue.add('generate', { exportId: record.id });
    return { id: record.id, status: ExportStatus.PENDING };
  }

  getAll(userId: string) {
    return this.exports.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getDownloadUrl(id: string, userId: string) {
    const record = await this.exports.findOne({ where: { id, userId } });
    if (!record) throw new NotFoundException('Exportação não encontrada');
    if (record.status !== ExportStatus.DONE) {
      return { status: record.status, fileUrl: null };
    }
    if (record.expiresAt && record.expiresAt < new Date()) {
      return { status: 'expired', fileUrl: null, expiresAt: record.expiresAt };
    }
    return { status: record.status, fileUrl: record.fileUrl, expiresAt: record.expiresAt ?? null };
  }

  async generateCsv(
    userId: string,
    from: string,
    to: string,
    includes: string[],
  ): Promise<string> {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const rows: string[] = [];

    if (includes.includes('moods')) {
      const moods = await this.moods.find({
        where: { userId, createdAt: Between(fromDate, toDate) },
        order: { createdAt: 'ASC' },
      });
      rows.push('--- HUMOR ---');
      rows.push('Data,Pontuação,Etiqueta,Privado');
      for (const m of moods) {
        rows.push(`${fmtDate(m.createdAt)},${m.score},"${(m.label ?? '').replace(/"/g, '""')}",${m.isPrivate ? 'Sim' : 'Não'}`);
      }
      rows.push('');
    }

    if (includes.includes('symptoms')) {
      const symptoms = await this.symptoms.find({
        where: { userId, createdAt: Between(fromDate, toDate) },
        order: { createdAt: 'ASC' },
      });
      rows.push('--- SINTOMAS ---');
      rows.push('Data,Sintoma,Gravidade,Privado');
      for (const s of symptoms) {
        rows.push(`${fmtDate(s.createdAt)},"${s.symptom.replace(/"/g, '""')}",${s.severity},${s.isPrivate ? 'Sim' : 'Não'}`);
      }
      rows.push('');
    }

    if (includes.includes('medications')) {
      const meds = await this.medications.find({
        where: { userId, createdAt: Between(fromDate, toDate) },
        order: { createdAt: 'ASC' },
      });
      rows.push('--- MEDICAMENTOS ---');
      rows.push('Data,Nome,Dose,Tomado,Prescrito por médico');
      for (const m of meds) {
        rows.push(`${fmtDate(m.createdAt)},"${m.name.replace(/"/g, '""')}","${(m.dose ?? '').replace(/"/g, '""')}",${m.taken ? 'Sim' : 'Não'},${m.prescribedBy ? 'Sim' : 'Não'}`);
      }
      rows.push('');
    }

    return rows.join('\r\n');
  }
}

function fmtDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
