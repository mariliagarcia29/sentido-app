import { Controller, Get, Post, Delete, Param, Body, UseGuards, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { AppointmentsService } from '../appointments/appointments.service';

@UseGuards(JwtAuthGuard)
@Controller('availability')
export class AvailabilityController {
  constructor(
    private readonly availability: AvailabilityService,
    private readonly appointments: AppointmentsService,
  ) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.DOCTOR)
  @Get('mine')
  getMySlots(@CurrentUser() user: User) {
    return this.availability.getMySlots(user.id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.DOCTOR)
  @Post()
  createSlot(@CurrentUser() user: User, @Body() dto: CreateSlotDto) {
    return this.availability.createSlot(user.id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.DOCTOR)
  @Delete(':id')
  deleteSlot(@CurrentUser() user: User, @Param('id') id: string) {
    return this.availability.deleteSlot(user.id, id);
  }

  @Get('doctor/:doctorId')
  getAvailableSlots(@Param('doctorId') doctorId: string) {
    return this.availability.getAvailableSlots(doctorId);
  }

  @Post(':id/book')
  async bookSlot(@CurrentUser() user: User, @Param('id') slotId: string) {
    const slot = await this.availability.getSlotById(slotId);
    if (!slot) throw new NotFoundException('Slot não encontrado');
    if (slot.isBooked) throw new ForbiddenException('Slot já agendado');

    const scheduledAt = new Date(`${slot.date}T${slot.startTime}:00`).toISOString();
    const appointment = await this.appointments.create(user.id, { doctorId: slot.doctorId, scheduledAt });
    await this.availability.markBooked(slotId, appointment.id);
    return { slot: { ...slot, isBooked: true, appointmentId: appointment.id }, appointment };
  }
}
