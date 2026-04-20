import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { TelemedicineService } from './telemedicine.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('telemedicine')
export class TelemedicineController {
  constructor(private readonly telemedicine: TelemedicineService) {}

  // Cria ou recupera sala de vídeo para uma consulta
  @Post('appointments/:id/room')
  getOrCreateRoom(@Param('id') id: string, @CurrentUser() user: User) {
    return this.telemedicine.getOrCreateRoom(id, user.id);
  }

  // Gera token Daily.co com permissões do usuário
  @Get('appointments/:id/token')
  async getToken(@Param('id') id: string, @CurrentUser() user: User) {
    const { roomId } = await this.telemedicine.getOrCreateRoom(id, user.id);
    const isOwner = user.role === UserRole.DOCTOR;
    return this.telemedicine.createToken(roomId, user.id, isOwner);
  }
}
