import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@UseGuards(JwtAuthGuard)
@Controller('preferences')
export class PreferencesController {
  constructor(private readonly prefs: PreferencesService) {}

  @Get()
  get(@CurrentUser() user: User) {
    return this.prefs.get(user.id);
  }

  @Patch()
  update(@CurrentUser() user: User, @Body() dto: UpdatePreferencesDto) {
    return this.prefs.update(user.id, dto);
  }
}
