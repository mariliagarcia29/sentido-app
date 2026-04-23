import { IsDateString, IsString, Matches } from 'class-validator';

const TIME_REGEX = /^\d{2}:\d{2}$/;

export class CreateSlotDto {
  @IsDateString()
  date: string;

  @IsString()
  @Matches(TIME_REGEX, { message: 'startTime deve estar no formato HH:mm' })
  startTime: string;

  @IsString()
  @Matches(TIME_REGEX, { message: 'endTime deve estar no formato HH:mm' })
  endTime: string;
}
