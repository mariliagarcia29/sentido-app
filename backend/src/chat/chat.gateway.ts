import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: (process.env.FRONTEND_ORIGIN ?? 'http://localhost:8081').split(',').map(o => o.trim()), credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private connectedUsers = new Map<string, { userId: string; fullName: string }>();

  constructor(
    private readonly chat: ChatService,
    private readonly jwt: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string;
      if (!token) throw new Error('No token');
      const payload = this.jwt.verify<{ sub: string; email: string; fullName?: string }>(token);
      this.connectedUsers.set(client.id, { userId: payload.sub, fullName: payload.fullName ?? payload.email });
      client.data.userId = payload.sub;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() roomId: string) {
    try {
      await this.chat.assertRoomAccess(roomId, client.data.userId);
    } catch {
      client.emit('error', 'Acesso negado a esta sala');
      return;
    }
    await client.join(roomId);
    client.data.currentRoom = roomId;
    const history = await this.chat.getHistory(roomId);
    client.emit('history', history);
    client.to(roomId).emit('userJoined', { userId: client.data.userId });
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() roomId: string) {
    client.leave(roomId);
    client.to(roomId).emit('userLeft', { userId: client.data.userId });
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() dto: SendMessageDto) {
    if (!client.data.userId) return;
    // Confirma que o cliente está na sala que ele declarou (join já validou ownership)
    if (client.data.currentRoom !== dto.roomId) {
      client.emit('error', 'Você não está nesta sala');
      return;
    }
    const message = await this.chat.saveMessage(dto.roomId, client.data.userId, dto.content);
    this.server.to(dto.roomId).emit('message', message);
  }

  @SubscribeMessage('typing')
  handleTyping(@ConnectedSocket() client: Socket, @MessageBody() roomId: string) {
    client.to(roomId).emit('typing', { userId: client.data.userId });
  }
}
