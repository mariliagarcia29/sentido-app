import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from '../appointments/entities/appointment.entity';

@Injectable()
export class TelemedicineService {
  private readonly logger = new Logger(TelemedicineService.name);
  private readonly dailyApiKey: string;
  private readonly dailyDomain: string;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Appointment)
    private readonly appointments: Repository<Appointment>,
  ) {
    this.dailyApiKey = this.config.get('DAILY_API_KEY', '');
    this.dailyDomain = this.config.get('DAILY_DOMAIN', '');
  }

  async getOrCreateRoom(appointmentId: string, requesterId: string) {
    const appt = await this.appointments.findOne({
      where: { id: appointmentId },
      relations: ['doctor', 'patient'],
    });
    if (!appt) throw new NotFoundException('Consulta não encontrada');

    const isParticipant = appt.patientId === requesterId || appt.doctorId === requesterId;
    if (!isParticipant) throw new NotFoundException('Consulta não encontrada');

    // Se já tem sala criada, retorna ela
    if (appt.meetingUrl && appt.roomId) {
      return { roomId: appt.roomId, meetingUrl: appt.meetingUrl };
    }

    // Cria sala no Daily.co
    const room = await this.createDailyRoom(appointmentId);
    appt.roomId = room.name;
    appt.meetingUrl = room.url;
    appt.status = AppointmentStatus.CONFIRMED;
    await this.appointments.save(appt);

    return { roomId: room.name, meetingUrl: room.url };
  }

  private async createDailyRoom(appointmentId: string) {
    if (!this.dailyApiKey) {
      // Sem API key: retorna sala simulada (desenvolvimento)
      const name = `sentido-${appointmentId.slice(0, 8)}`;
      this.logger.warn('DAILY_API_KEY não configurada — usando sala simulada');
      return { name, url: `https://sentido.daily.co/${name}` };
    }

    const exp = Math.floor(Date.now() / 1000) + 3600; // expira em 1h
    const res = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.dailyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `sentido-${appointmentId.slice(0, 8)}`,
        properties: { exp, enable_chat: false, enable_knocking: true },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      this.logger.error(`Daily.co room creation failed: ${err}`);
      const name = `sentido-${appointmentId.slice(0, 8)}`;
      return { name, url: `https://${this.dailyDomain}.daily.co/${name}` };
    }

    return await res.json() as { name: string; url: string };
  }

  async createToken(roomName: string, userId: string, isOwner: boolean) {
    if (!this.dailyApiKey) {
      return { token: null };
    }
    const res = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.dailyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: { room_name: roomName, user_id: userId, is_owner: isOwner },
      }),
    });
    return await res.json() as { token: string };
  }
}
