import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage, MessageType } from './entities/chat-message.entity';
import { Appointment } from '../appointments/entities/appointment.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly messages: Repository<ChatMessage>,
    @InjectRepository(Appointment)
    private readonly appointments: Repository<Appointment>,
  ) {}

  // Verifica se userId é médico ou paciente da consulta vinculada ao roomId
  async assertRoomAccess(roomId: string, userId: string): Promise<void> {
    const appt = await this.appointments.findOne({ where: { roomId } });
    if (!appt || (appt.patientId !== userId && appt.doctorId !== userId)) {
      throw new ForbiddenException('Acesso negado a esta sala');
    }
  }

  async saveMessage(roomId: string, senderId: string, content: string, type = MessageType.TEXT) {
    const msg = await this.messages.save(
      this.messages.create({ roomId, senderId, content, type }),
    );
    return this.messages.findOne({ where: { id: msg.id }, relations: ['sender'] });
  }

  getHistory(roomId: string, limit = 50) {
    return this.messages.find({
      where: { roomId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }
}
