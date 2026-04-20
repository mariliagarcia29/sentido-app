import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getChatSocket(): Socket {
  if (!socket || !socket.connected) {
    const token = localStorage.getItem('token');
    socket = io('/chat', {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket'],
    });
  }
  return socket;
}

export function disconnectChatSocket() {
  socket?.disconnect();
  socket = null;
}
