import { IsString, IsBoolean, IsOptional, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class QuietHoursDto {
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  start: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  end: string;
}

export class UpdatePreferencesDto {
  @IsString()
  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'reminderTime deve estar no formato HH:MM' })
  reminderTime?: string;

  @ValidateNested()
  @Type(() => QuietHoursDto)
  @IsOptional()
  quietHours?: QuietHoursDto;

  @IsBoolean()
  @IsOptional()
  appointmentReminders?: boolean;

  @IsBoolean()
  @IsOptional()
  alertNotifications?: boolean;

  @IsString()
  @IsOptional()
  language?: string;
}
