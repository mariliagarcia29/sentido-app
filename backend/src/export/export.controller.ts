import { Controller, Post, Get, Param, Body, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateExportDto } from './dto/create-export.dto';

@UseGuards(JwtAuthGuard)
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post()
  requestExport(@CurrentUser() user: User, @Body() dto: CreateExportDto) {
    return this.exportService.requestExport(user.id, dto);
  }

  @Get()
  getAll(@CurrentUser() user: User) {
    return this.exportService.getAll(user.id);
  }

  @Get('csv')
  async downloadCsv(
    @CurrentUser() user: User,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('includes') includesParam: string,
    @Res() res: Response,
  ) {
    const includes = includesParam ? includesParam.split(',') : ['moods', 'symptoms', 'medications'];
    const csv = await this.exportService.generateCsv(user.id, from, to, includes);
    const filename = `sentido-${from}-${to}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('﻿' + csv); // BOM for Excel UTF-8
  }

  @Get(':id')
  getDownload(@Param('id') id: string, @CurrentUser() user: User) {
    return this.exportService.getDownloadUrl(id, user.id);
  }
}
