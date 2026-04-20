import { IsString, IsEnum, IsBoolean, IsOptional, MaxLength } from 'class-validator';
import { Severity } from '../entities/symptom-record.entity';

export class CreateSymptomDto {
  @IsString()
  @MaxLength(200)
  symptom: string;

  @IsEnum(Severity) @IsOptional()
  severity?: Severity;

  @IsBoolean() @IsOptional()
  isPrivate?: boolean;
}
