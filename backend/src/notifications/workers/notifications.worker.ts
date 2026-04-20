import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NotificationsService, PushPayload } from '../notifications.service';

export const NOTIFICATIONS_QUEUE = 'notifications';

export interface NotificationJob {
  userId: string;
  payload: PushPayload;
}

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsWorker {
  private readonly logger = new Logger(NotificationsWorker.name);

  constructor(private readonly notifications: NotificationsService) {}

  @Process('send')
  async handle(job: Job<NotificationJob>) {
    const { userId, payload } = job.data;
    this.logger.debug(`Enviando push para userId=${userId}: ${payload.title}`);
    await this.notifications.sendToUser(userId, payload);
  }
}
