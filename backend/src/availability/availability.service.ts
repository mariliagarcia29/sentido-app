import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw } from 'typeorm';
import { AvailabilitySlot } from './entities/availability-slot.entity';
import { CreateSlotDto } from './dto/create-slot.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(AvailabilitySlot)
    private readonly slots: Repository<AvailabilitySlot>,
  ) {}

  createSlot(doctorId: string, dto: CreateSlotDto) {
    return this.slots.save(this.slots.create({ doctorId, ...dto, isBooked: false }));
  }

  getMySlots(doctorId: string) {
    const today = new Date().toISOString().split('T')[0];
    return this.slots.find({
      where: { doctorId, date: Raw((col) => `${col} >= :today`, { today }) },
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async deleteSlot(doctorId: string, slotId: string) {
    const slot = await this.slots.findOne({ where: { id: slotId, doctorId } });
    if (!slot) throw new NotFoundException('Slot não encontrado');
    if (slot.isBooked) throw new ForbiddenException('Slot já possui agendamento');
    await this.slots.delete(slotId);
  }

  getAvailableSlots(doctorId: string) {
    const today = new Date().toISOString().split('T')[0];
    return this.slots.find({
      where: {
        doctorId,
        isBooked: false,
        date: Raw((col) => `${col} >= :today`, { today }),
      },
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async getSlotById(slotId: string) {
    return this.slots.findOne({ where: { id: slotId } });
  }

  async markBooked(slotId: string, appointmentId: string) {
    await this.slots.update(slotId, { isBooked: true, appointmentId });
  }
}
