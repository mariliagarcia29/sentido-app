import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelemedicineService } from './telemedicine.service';
import { TelemedicineController } from './telemedicine.controller';
import { ConversationsController } from './conversations.controller';
import { Appointment } from '../appointments/entities/appointment.entity';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment]), AppointmentsModule, ChatModule],
  providers: [TelemedicineService],
  controllers: [TelemedicineController, ConversationsController],
  exports: [TelemedicineService],
})
export class TelemedicineModule {}
