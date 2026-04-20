import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { PdfWorker, PDF_QUEUE } from './workers/pdf.worker';
import { PdfExport } from './entities/pdf-export.entity';
import { MoodEntry } from '../records/entities/mood-entry.entity';
import { SymptomRecord } from '../records/entities/symptom-record.entity';
import { MedicationRecord } from '../records/entities/medication-record.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([PdfExport, MoodEntry, SymptomRecord, MedicationRecord]),
    BullModule.registerQueue({ name: PDF_QUEUE }),
  ],
  providers: [ExportService, PdfWorker],
  controllers: [ExportController],
})
export class ExportModule {}
