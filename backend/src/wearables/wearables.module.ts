import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WearablesService } from './wearables.service';
import { WearablesController } from './wearables.controller';
import { WearableData } from './entities/wearable-data.entity';
import { WearableConnection } from './entities/wearable-connection.entity';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WearableData, WearableConnection]),
    AlertsModule,
  ],
  providers: [WearablesService],
  controllers: [WearablesController],
  exports: [WearablesService],
})
export class WearablesModule {}
