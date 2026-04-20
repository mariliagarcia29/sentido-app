import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get(':roomId/history')
  async getHistory(@Param('roomId') roomId: string, @CurrentUser() user: User) {
    await this.chat.assertRoomAccess(roomId, user.id);
    return this.chat.getHistory(roomId);
  }
}
