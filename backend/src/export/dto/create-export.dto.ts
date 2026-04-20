import { IsDateString, IsArray, ArrayMinSize, ArrayMaxSize, IsIn } from 'class-validator';
import { BadRequestException } from '@nestjs/common';

export type ExportSection = 'moods' | 'symptoms' | 'medications';

const ALLOWED_SECTIONS: ExportSection[] = ['moods', 'symptoms', 'medications'];

export class CreateExportDto {
  @IsDateString()
  periodFrom!: string;

  @IsDateString()
  periodTo!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsIn(ALLOWED_SECTIONS, { each: true })
  includes!: ExportSection[];

  // Valida regras de negócio que dependem de múltiplos campos
  static validate(dto: CreateExportDto) {
    const from = new Date(dto.periodFrom);
    const to = new Date(dto.periodTo);
    if (from >= to) throw new BadRequestException('periodFrom deve ser anterior a periodTo');
    const maxMs = 366 * 24 * 60 * 60 * 1000;
    if (to.getTime() - from.getTime() > maxMs) throw new BadRequestException('Período máximo de exportação é 1 ano');
  }
}
