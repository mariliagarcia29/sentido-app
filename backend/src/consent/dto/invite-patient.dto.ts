import { IsEmail, IsOptional, IsEnum } from 'class-validator';

export enum AccessLevel {
  FULL = 'full',
  READ_ONLY = 'read_only',
}

export class InvitePatientDto {
  @IsEmail()
  patientEmail: string;

  @IsEnum(AccessLevel)
  @IsOptional()
  accessLevel?: AccessLevel;
}
