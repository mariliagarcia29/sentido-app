import { IsInt, Min, Max, IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';

export class CreateMoodDto {
  @IsInt() @Min(1) @Max(10)
  score: number;

  @IsString() @IsOptional()
  @MaxLength(200)
  label?: string;

  @IsBoolean() @IsOptional()
  isPrivate?: boolean;
}
