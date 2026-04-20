import { Controller, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { RegisterTokenDto } from './dto/register-token.dto';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  // Mobile/Web registra token após login ou grant de permissão
  @Post('token')
  registerToken(@CurrentUser() user: User, @Body() dto: RegisterTokenDto) {
    return this.notifications.registerToken(user.id, dto.platform, dto.token);
  }

  // Mobile/Web remove token no logout
  @Delete('token')
  deactivateToken(@CurrentUser() user: User, @Body('token') token: string) {
    return this.notifications.deactivateToken(user.id, token);
  }
}
