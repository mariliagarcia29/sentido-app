import { IsEnum, IsNumber, IsString, IsOptional, IsDateString, Min, Max, MaxLength } from 'class-validator';
import { WearableSource, WearableDataType } from '../entities/wearable-data.entity';

export class PushWearableDataDto {
  @IsEnum(WearableSource)
  source: WearableSource;

  @IsEnum(WearableDataType)
  dataType: WearableDataType;

  @IsNumber()
  @Min(0)
  @Max(9_999_999)
  value: number;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  unit?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  deviceName?: string;

  @IsDateString()
  recordedAt: string;
}
