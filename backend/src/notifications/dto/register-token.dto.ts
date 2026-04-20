import { IsEnum, IsString } from 'class-validator';
import { DevicePlatform } from '../entities/device-token.entity';

export class RegisterTokenDto {
  @IsEnum(DevicePlatform)
  platform: DevicePlatform;

  @IsString()
  token: string;
}
