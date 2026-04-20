import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConsentService } from './consent.service';
import { ConsentController } from './consent.controller';
import { ConsentRecord } from './entities/consent-record.entity';
import { User } from '../users/entities/user.entity';
import { AuditLog } from '../common/entities/audit-log.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([ConsentRecord, User, AuditLog]),
  ],
  providers: [ConsentService],
  controllers: [ConsentController],
  exports: [ConsentService],
})
export class ConsentModule {}
