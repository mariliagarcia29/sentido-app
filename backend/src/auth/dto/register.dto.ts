import { IsEmail, IsString, IsEnum, MinLength, MaxLength, Matches, IsDateString, IsOptional } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsString()
  @MaxLength(100)
  fullName: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @MinLength(8)
  @MaxLength(128)
  // Exige ao menos: 1 maiúscula, 1 minúscula, 1 número, 1 caractere especial
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
    message: 'A senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais',
  })
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  specialty?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  crmLink?: string;
}
