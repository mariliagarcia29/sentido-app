import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';

import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { RecordsModule } from './records/records.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ExportModule } from './export/export.module';
import { ConsentModule } from './consent/consent.module';
import { ObservationsModule } from './observations/observations.module';
import { DoctorModule } from './doctor/doctor.module';
import { AlertsModule } from './alerts/alerts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PreferencesModule } from './preferences/preferences.module';
import { ChatModule } from './chat/chat.module';
import { TelemedicineModule } from './telemedicine/telemedicine.module';
import { WearablesModule } from './wearables/wearables.module';

import { User } from './users/entities/user.entity';
import { OauthAccount } from './auth/entities/oauth-account.entity';
import { TokenBlacklist } from './auth/entities/token-blacklist.entity';
import { MoodEntry } from './records/entities/mood-entry.entity';
import { SymptomRecord } from './records/entities/symptom-record.entity';
import { MedicationRecord } from './records/entities/medication-record.entity';
import { Appointment } from './appointments/entities/appointment.entity';
import { PdfExport } from './export/entities/pdf-export.entity';
import { AuditLog } from './common/entities/audit-log.entity';
import { ConsentRecord } from './consent/entities/consent-record.entity';
import { ClinicalObservation } from './observations/entities/clinical-observation.entity';
import { DeviceToken } from './notifications/entities/device-token.entity';
import { UserPreferences } from './preferences/entities/user-preferences.entity';
import { ChatMessage } from './chat/entities/chat-message.entity';
import { WearableData } from './wearables/entities/wearable-data.entity';
import { WearableConnection } from './wearables/entities/wearable-connection.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        database: config.get('DB_NAME', 'sentido'),
        username: config.get('DB_USER', 'sentido'),
        password: config.get('DB_PASSWORD', 'sentido_dev'),
        entities: [
          User, OauthAccount, TokenBlacklist, MoodEntry, SymptomRecord, MedicationRecord,
          Appointment, PdfExport, AuditLog, ConsentRecord, ClinicalObservation,
          DeviceToken, UserPreferences, ChatMessage, WearableData, WearableConnection,
        ],
        synchronize: config.get('NODE_ENV') !== 'production',
        ssl: config.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }),
    }),

    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD') || undefined,
          // TLS obrigatório no Upstash e no ElastiCache em produção
          tls: config.get('REDIS_TLS') === 'true' ? {} : undefined,
        },
      }),
    }),

    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),

    HealthModule,
    AuthModule,
    RecordsModule,
    AppointmentsModule,
    ExportModule,
    ConsentModule,
    ObservationsModule,
    DoctorModule,
    AlertsModule,
    NotificationsModule,
    PreferencesModule,
    ChatModule,
    TelemedicineModule,
    WearablesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
