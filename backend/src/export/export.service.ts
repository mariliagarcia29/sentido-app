import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { PdfExport, ExportStatus } from './entities/pdf-export.entity';
import { CreateExportDto } from './dto/create-export.dto';
import { PDF_QUEUE } from './workers/pdf.worker';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(PdfExport) private readonly exports: Repository<PdfExport>,
    @InjectQueue(PDF_QUEUE) private readonly pdfQueue: Queue,
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
}
