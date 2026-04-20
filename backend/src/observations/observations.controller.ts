import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ObservationsService } from './observations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateObservationDto } from './dto/create-observation.dto';

@UseGuards(JwtAuthGuard)
@Controller('observations')
export class ObservationsController {
  constructor(private readonly obs: ObservationsService) {}

  // Rotas literais ANTES das parametrizadas para evitar shadowing

  // Paciente vê suas próprias observações e alertas
  @Get('mine')
  getMine(@CurrentUser() user: User) {
    return this.obs.getMine(user.id);
  }

  // Paciente consulta contagem de não lidas
  @Get('unread-count')
  unreadCount(@CurrentUser() user: User) {
    return this.obs.countUnread(user.id);
  }

  // Médico cria observação (body com patientId)
  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateObservationDto) {
    return this.obs.createByDoctor(user.id, dto);
  }

  // Médico cria observação (patientId via path param)
  @Post(':patientId')
  createForPatient(
    @CurrentUser() user: User,
    @Param('patientId') patientId: string,
    @Body() dto: Omit<CreateObservationDto, 'patientId'>,
  ) {
    return this.obs.createByDoctor(user.id, { ...dto, patientId } as CreateObservationDto);
  }

  // Médico vê observações de um paciente vinculado (path /patient/:id)
  @Get('patient/:patientId')
  getForPatient(@CurrentUser() user: User, @Param('patientId') patientId: string) {
    return this.obs.getForPatient(user.id, patientId);
  }

  // Médico vê observações de um paciente (path /:patientId — alias)
  @Get(':patientId')
  getForPatientAlias(@CurrentUser() user: User, @Param('patientId') patientId: string) {
    return this.obs.getForPatient(user.id, patientId);
  }

  // Paciente marca como lida
  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: User) {
    return this.obs.markRead(id, user.id);
  }
}
