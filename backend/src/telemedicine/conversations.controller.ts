import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { AppointmentsService } from '../appointments/appointments.service';
import { CreateAppointmentDto } from '../appointments/dto/create-appointment.dto';
import { ChatService } from '../chat/chat.service';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(
    private readonly appointments: AppointmentsService,
    private readonly chat: ChatService,
  ) {}

  // Inicia uma consulta manual (cria appointment + sala de vídeo imediatamente)
  @Post('manual')
  startManual(@CurrentUser() user: User, @Body() dto: CreateAppointmentDto) {
    return this.appointments.create(user.id, dto);
  }

  // Carrega o histórico de chat de uma sala/consulta
  @Get(':id')
  async getConversation(@Param('id') id: string, @CurrentUser() user: User) {
    await this.chat.assertRoomAccess(id, user.id);
    return this.chat.getHistory(id);
  }
}
