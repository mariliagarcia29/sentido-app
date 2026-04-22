import { IsUUID, IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ObservationSeverity } from '../entities/clinical-observation.entity';

export class CreateObservationDto {
  @IsUUID()
  patientId: string;

  @IsString()
  @MaxLength(2000)
  content: string;

  @IsEnum(ObservationSeverity)
  @IsOptional()
  severity?: ObservationSeverity;

  @IsString()
  @IsOptional()
  observationType?: string;
}
