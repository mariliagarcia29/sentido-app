import { Controller, Get, Post, Delete, Param, Body, UseGuards, ForbiddenException, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { AppointmentsService } from '../appointments/appointments.service';

@UseGuards(JwtAuthGuard, FeatureGuard('NATIVE_APPOINTMENTS'))
@Controller('availability')
export class AvailabilityController {
  private readonly logger = new Logger(AvailabilityController.name);

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

    try {
      const dateStr = String(slot.date).split('T')[0];
      const timeStr = String(slot.startTime).substring(0, 8);
      const scheduledAt = new Date(`${dateStr}T${timeStr}Z`).toISOString();

      const appointment = await this.appointments.create(user.id, { doctorId: slot.doctorId, scheduledAt });
      await this.availability.markBooked(slotId, appointment.id);
      return { slot: { ...slot, isBooked: true, appointmentId: appointment.id }, appointment };
    } catch (err: any) {
      this.logger.error(`bookSlot error: ${err?.message}`, err?.stack);
      throw err;
    }
  }
}
