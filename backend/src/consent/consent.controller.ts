import {
  Controller, Post, Patch, Get, Body, Param, Req, UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { ConsentService } from './consent.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { InvitePatientDto } from './dto/invite-patient.dto';

@UseGuards(JwtAuthGuard)
@Controller('consent')
export class ConsentController {
  constructor(private readonly consent: ConsentService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return user.role === UserRole.DOCTOR
      ? this.consent.getMyPatients(user.id)
      : this.consent.getMyDoctors(user.id);
  }

  @Post('request')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  request(@CurrentUser() user: User, @Body('doctorEmail') doctorEmail: string, @Req() req: Request) {
    return this.consent.requestByPatient(user.id, doctorEmail, req.ip ?? '');
  }

  @Patch(':id')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  act(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body('action') action: 'approve' | 'revoke',
    @Req() req: Request,
  ) {
    if (action === 'approve') return this.consent.respond(id, user.id, true, req.ip ?? '');
    return this.consent.revoke(id, user.id, req.ip ?? '');
  }

  @Post('invite')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  invite(@CurrentUser() user: User, @Body() dto: InvitePatientDto, @Req() req: Request) {
    return this.consent.invite(user.id, dto, req.ip ?? '');
  }

  @Patch(':id/respond')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  respond(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body('approve') approve: boolean,
    @Req() req: Request,
  ) {
    return this.consent.respond(id, user.id, approve, req.ip ?? '');
  }

  @Patch(':id/revoke')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  revoke(@Param('id') id: string, @CurrentUser() user: User, @Req() req: Request) {
    return this.consent.revoke(id, user.id, req.ip ?? '');
  }

  @Get('pending')
  pending(@CurrentUser() user: User) {
    return this.consent.getPending(user.id);
  }

  @Get('my-doctors')
  getMyDoctors(@CurrentUser() user: User) {
    return this.consent.getMyDoctors(user.id);
  }

  @Get('my-patients')
  getMyPatients(@CurrentUser() user: User) {
    return this.consent.getMyPatients(user.id);
  }
}
