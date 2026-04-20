import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AlertsService } from './alerts.service';
import { MoodEntry } from '../records/entities/mood-entry.entity';
import { MedicationRecord } from '../records/entities/medication-record.entity';
import { WearableData } from '../wearables/entities/wearable-data.entity';
import { ObservationsModule } from '../observations/observations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MoodEntry, MedicationRecord, WearableData]),
    ObservationsModule,
  ],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
