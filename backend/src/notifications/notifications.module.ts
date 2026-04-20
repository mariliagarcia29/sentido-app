import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsWorker, NOTIFICATIONS_QUEUE } from './workers/notifications.worker';
import { RemindersService } from './reminders.service';
import { DeviceToken } from './entities/device-token.entity';
import { UserPreferences } from '../preferences/entities/user-preferences.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeviceToken, UserPreferences]),
    BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE }),
  ],
  providers: [NotificationsService, NotificationsWorker, RemindersService],
  controllers: [NotificationsController],
  exports: [NotificationsService, RemindersService],
})
export class NotificationsModule {}
