import { IsUUID, IsDateString } from 'class-validator';
import { BadRequestException } from '@nestjs/common';

export class CreateAppointmentDto {
  @IsUUID()
  doctorId: string;

  @IsDateString()
  scheduledAt: string;

  static validate(dto: CreateAppointmentDto) {
    if (new Date(dto.scheduledAt) <= new Date()) {
      throw new BadRequestException('scheduledAt deve ser uma data futura');
    }
  }
}
