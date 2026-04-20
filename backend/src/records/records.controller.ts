import { Controller, Get, Post, Delete, Param, Body, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { RecordsService } from './records.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateMoodDto } from './dto/create-mood.dto';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { CreateMedicationDto } from './dto/create-medication.dto';

@UseGuards(JwtAuthGuard)
@Controller('records')
export class RecordsController {
  constructor(private readonly records: RecordsService) {}

  @Get('moods')
  getMoods(@CurrentUser() user: User) {
    return this.records.getMoods(user.id);
  }

  @Post('moods')
  createMood(@CurrentUser() user: User, @Body() dto: CreateMoodDto, @Req() req: Request) {
    return this.records.createMood(user.id, dto, req.ip ?? '');
  }

  @Get('symptoms')
  getSymptoms(@CurrentUser() user: User) {
    return this.records.getSymptoms(user.id);
  }

  @Post('symptoms')
  createSymptom(@CurrentUser() user: User, @Body() dto: CreateSymptomDto, @Req() req: Request) {
    return this.records.createSymptom(user.id, dto, req.ip ?? '');
  }

  @Get('medications')
  getMedications(@CurrentUser() user: User) {
    return this.records.getMedications(user.id);
  }

  @Post('medications')
  createMedication(@CurrentUser() user: User, @Body() dto: CreateMedicationDto, @Req() req: Request) {
    return this.records.createMedication(user.id, dto, req.ip ?? '');
  }

  @Delete('moods/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMood(@Param('id') id: string, @CurrentUser() user: User, @Req() req: Request) {
    return this.records.deleteMood(id, user.id, req.ip ?? '');
  }

  @Delete('symptoms/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSymptom(@Param('id') id: string, @CurrentUser() user: User, @Req() req: Request) {
    return this.records.deleteSymptom(id, user.id, req.ip ?? '');
  }

  @Delete('medications/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMedication(@Param('id') id: string, @CurrentUser() user: User, @Req() req: Request) {
    return this.records.deleteMedication(id, user.id, req.ip ?? '');
  }
}
