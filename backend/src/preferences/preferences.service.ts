import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserPreferences } from './entities/user-preferences.entity';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { RemindersService } from '../notifications/reminders.service';

@Injectable()
export class PreferencesService {
  constructor(
    @InjectRepository(UserPreferences) private readonly prefs: Repository<UserPreferences>,
    private readonly reminders: RemindersService,
  ) {}

  async get(userId: string): Promise<UserPreferences> {
    const existing = await this.prefs.findOne({ where: { userId } });
    if (existing) return existing;
    // Cria com valores padrão na primeira consulta
    return this.prefs.save(this.prefs.create({ userId }));
  }

  async update(userId: string, dto: UpdatePreferencesDto): Promise<UserPreferences> {
    let pref = await this.prefs.findOne({ where: { userId } });
    if (!pref) pref = this.prefs.create({ userId });

    Object.assign(pref, dto);
    const saved = await this.prefs.save(pref);

    // Reagenda lembrete se horário mudou
    if (dto.reminderTime !== undefined) {
      if (dto.reminderTime) {
        await this.reminders.scheduleDaily(userId, dto.reminderTime);
      } else {
        await this.reminders.cancelDaily(userId);
      }
    }

    return saved;
  }
}
