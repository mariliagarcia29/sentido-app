import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';
import { MoodEntry } from '../records/entities/mood-entry.entity';
import { SymptomRecord } from '../records/entities/symptom-record.entity';
import { MedicationRecord } from '../records/entities/medication-record.entity';
import { AuditLog } from '../common/entities/audit-log.entity';
import { ConsentModule } from '../consent/consent.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MoodEntry, SymptomRecord, MedicationRecord, AuditLog]),
    ConsentModule,
  ],
  providers: [DoctorService],
  controllers: [DoctorController],
})
export class DoctorModule {}
