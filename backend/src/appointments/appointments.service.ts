import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RemindersService } from '../notifications/reminders.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointments: Repository<Appointment>,
    private readonly reminders: RemindersService,
  ) {}

  getMine(patientId: string) {
    return this.appointments.find({
      where: { patientId },
      relations: ['doctor'],
      order: { scheduledAt: 'ASC' },
    });
  }

  async create(patientId: string, dto: CreateAppointmentDto) {
    CreateAppointmentDto.validate(dto);
    const appt = await this.appointments.save(
      this.appointments.create({
        patientId,
        doctorId: dto.doctorId,
        scheduledAt: new Date(dto.scheduledAt),
      }),
    );

    // Agenda lembretes 24h e 1h antes
    const full = await this.appointments.findOne({ where: { id: appt.id }, relations: ['doctor'] });
    if (full) {
      this.reminders
        .scheduleAppointmentReminder(
          patientId,
          appt.id,
          appt.scheduledAt,
          full.doctor?.fullName ?? 'seu médico',
        )
        .catch(() => {});
    }

    return appt;
  }

  async cancel(id: string, patientId: string) {
    const appt = await this.appointments.findOne({ where: { id } });
    if (!appt) throw new NotFoundException('Consulta não encontrada');
    if (appt.patientId !== patientId) throw new ForbiddenException();
    appt.status = AppointmentStatus.CANCELLED;
    await this.appointments.save(appt);
    // Remove lembretes agendados
    this.reminders.cancelAppointmentReminder(id).catch(() => {});
    return appt;
  }

  async getById(id: string) {
    const appt = await this.appointments.findOne({ where: { id }, relations: ['doctor', 'patient'] });
    if (!appt) throw new NotFoundException('Consulta não encontrada');
    return appt;
  }
}
