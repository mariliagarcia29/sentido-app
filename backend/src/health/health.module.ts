import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { HealthController } from './health.controller';
import { PDF_QUEUE } from '../export/workers/pdf.worker';

@Module({
  imports: [BullModule.registerQueue({ name: PDF_QUEUE })],
  controllers: [HealthController],
})
export class HealthModule {}
