import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ObservationsService } from './observations.service';
import { ObservationsController } from './observations.controller';
import { ClinicalObservation } from './entities/clinical-observation.entity';
import { ConsentModule } from '../consent/consent.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([ClinicalObservation]), ConsentModule, NotificationsModule],
  providers: [ObservationsService],
  controllers: [ObservationsController],
  exports: [ObservationsService],
})
export class ObservationsModule {}
