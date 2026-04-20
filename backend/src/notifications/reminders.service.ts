import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { UserPreferences } from '../preferences/entities/user-preferences.entity';
import { NOTIFICATIONS_QUEUE, NotificationJob } from './workers/notifications.worker';

@Injectable()
export class RemindersService implements OnModuleInit {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @InjectRepository(UserPreferences) private readonly prefs: Repository<UserPreferences>,
    @InjectQueue(NOTIFICATIONS_QUEUE) private readonly queue: Queue,
  ) {}

  async onModuleInit() {
    // Após restart, Bull persiste jobs repeatable no Redis, mas reagendamos para garantir
    // consistência caso o Redis tenha sido limpo ou o cron tenha mudado.
    await this.rescheduleAllDailyReminders();
  }

  async scheduleDaily(userId: string, reminderTime: string) {
    const jobId = `daily-mood-${userId}`;
    // Remove repeatable existente antes de recriar (Bull v4: usar removeRepeatableByKey)
    await this.cancelDaily(userId);

    const [hour, minute] = reminderTime.split(':').map(Number);
    const cron = `${minute} ${hour} * * *`;

    await this.queue.add(
      'send',
      {
        userId,
        payload: {
          title: '💙 Como você está hoje?',
          body: 'Registre seu humor no Sentido. Leva menos de 10 segundos!',
          data: { type: 'daily_mood_reminder' },
        },
      } satisfies NotificationJob,
      { repeat: { cron }, jobId },
    );

    this.logger.log(`Lembrete diário agendado para userId=${userId} às ${reminderTime}`);
  }

  // Cancela lembrete diário — usa removeRepeatableByKey (correto para Bull v4)
  async cancelDaily(userId: string) {
    const jobId = `daily-mood-${userId}`;
    try {
      const repeatableJobs = await this.queue.getRepeatableJobs();
      const job = repeatableJobs.find((j) => j.id === jobId);
      if (job?.key) {
        await this.queue.removeRepeatableByKey(job.key);
      }
    } catch (err: any) {
      this.logger.warn(`Falha ao cancelar lembrete diário userId=${userId}: ${err.message}`);
    }
  }

  // Agenda lembretes de consulta 24h e 1h antes (delayed jobs — getJob() funciona normalmente)
  async scheduleAppointmentReminder(
    userId: string,
    appointmentId: string,
    scheduledAt: Date,
    doctorName: string,
  ) {
    const now = Date.now();
    const apptTime = scheduledAt.getTime();

    const delays: { label: string; ms: number }[] = [
      { label: '24h', ms: apptTime - 24 * 60 * 60 * 1000 },
      { label: '1h', ms: apptTime - 60 * 60 * 1000 },
    ];

    for (const { label, ms } of delays) {
      const delay = ms - now;
      if (delay <= 0) continue;

      await this.queue.add(
        'send',
        {
          userId,
          payload: {
            title: `📅 Consulta em ${label}`,
            body: `Sua consulta com ${doctorName} está chegando.`,
            data: { type: 'appointment_reminder', appointmentId, label },
          },
        } satisfies NotificationJob,
        {
          delay,
          jobId: `appt-${appointmentId}-${label}`,
          attempts: 2,
          backoff: { type: 'fixed', delay: 5000 },
        },
      );
    }
  }

  async cancelAppointmentReminder(appointmentId: string) {
    for (const label of ['24h', '1h']) {
      const job = await this.queue.getJob(`appt-${appointmentId}-${label}`);
      if (job) await job.remove();
    }
  }

  async rescheduleAllDailyReminders() {
    const all = await this.prefs.find({ where: { appointmentReminders: true } });
    let count = 0;
    for (const pref of all) {
      if (pref.reminderTime) {
        await this.scheduleDaily(pref.userId, pref.reminderTime);
        count++;
      }
    }
    this.logger.log(`${count} lembretes diários reagendados ao iniciar`);
  }
}
