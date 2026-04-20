import { IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';

export class CreateMedicationDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsString() @IsOptional()
  @MaxLength(100)
  dose?: string;

  @IsBoolean() @IsOptional()
  taken?: boolean;
}
