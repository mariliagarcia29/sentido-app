import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RecordsService } from './records.service';
import { RecordsController } from './records.controller';
import { MoodEntry } from './entities/mood-entry.entity';
import { SymptomRecord } from './entities/symptom-record.entity';
import { MedicationRecord } from './entities/medication-record.entity';
import { AuditLog } from '../common/entities/audit-log.entity';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MoodEntry, SymptomRecord, MedicationRecord, AuditLog]),
    AlertsModule,
  ],
  providers: [RecordsService],
  controllers: [RecordsController],
})
export class RecordsModule {}
