import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PreferencesService } from './preferences.service';
import { PreferencesController } from './preferences.controller';
import { UserPreferences } from './entities/user-preferences.entity';
@Module({
  imports: [TypeOrmModule.forFeature([UserPreferences])],
  providers: [PreferencesService],
  controllers: [PreferencesController],
  exports: [PreferencesService],
})
export class PreferencesModule {}
