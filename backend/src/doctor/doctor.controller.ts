import { Controller, Get, Post, Patch, Param, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { DoctorService } from './doctor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateMedicationDto } from '../records/dto/create-medication.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DOCTOR)
@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctor: DoctorService) {}

  @Get('patients')
  listPatients(@CurrentUser() user: User) {
    return this.doctor.listLinkedPatients(user.id);
  }

  @Get('patients/:patientId/summary')
  getSummary(
    @CurrentUser() user: User,
    @Param('patientId') patientId: string,
    @Req() req: Request,
  ) {
    return this.doctor.getPatientSummary(user.id, patientId, req.ip ?? '');
  }

  @Get('patients/:patientId/moods')
  getMoods(
    @CurrentUser() user: User,
    @Param('patientId') patientId: string,
    @Req() req: Request,
  ) {
    return this.doctor.getPatientMoods(user.id, patientId, req.ip ?? '');
  }

  @Get('patients/:patientId/symptoms')
  getSymptoms(
    @CurrentUser() user: User,
    @Param('patientId') patientId: string,
    @Req() req: Request,
  ) {
    return this.doctor.getPatientSymptoms(user.id, patientId, req.ip ?? '');
  }

  @Get('patients/:patientId/medications')
  getMedications(
    @CurrentUser() user: User,
    @Param('patientId') patientId: string,
    @Req() req: Request,
  ) {
    return this.doctor.getPatientMedications(user.id, patientId, req.ip ?? '');
  }

  @Patch('patients/:patientId/medications/:medicationId/archive')
  archiveMedication(
    @CurrentUser() user: User,
    @Param('patientId') patientId: string,
    @Param('medicationId') medicationId: string,
    @Req() req: Request,
  ) {
    return this.doctor.archiveMedication(user.id, patientId, medicationId, req.ip ?? '');
  }

  @Post('patients/:patientId/medications')
  prescribeMedication(
    @CurrentUser() user: User,
    @Param('patientId') patientId: string,
    @Body() dto: CreateMedicationDto,
    @Req() req: Request,
  ) {
    return this.doctor.prescribeMedication(user.id, patientId, dto, req.ip ?? '');
  }
}
