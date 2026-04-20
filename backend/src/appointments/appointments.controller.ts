import { Controller, Get, Post, Delete, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get()
  getAll(@CurrentUser() user: User) {
    return this.appointments.getMine(user.id);
  }

  @Get('mine')
  getMine(@CurrentUser() user: User) {
    return this.appointments.getMine(user.id);
  }

  @Patch(':id/cancel')
  cancelPatch(@Param('id') id: string, @CurrentUser() user: User) {
    return this.appointments.cancel(id, user.id);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.appointments.getById(id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateAppointmentDto) {
    return this.appointments.create(user.id, dto);
  }

  // Alias semântico: paciente convida/agenda com médico
  @Post('invite')
  invite(@CurrentUser() user: User, @Body() dto: CreateAppointmentDto) {
    return this.appointments.create(user.id, dto);
  }

  @Delete(':id')
  cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.appointments.cancel(id, user.id);
  }
}
