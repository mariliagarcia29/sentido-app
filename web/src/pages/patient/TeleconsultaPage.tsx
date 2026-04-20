import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { telemedicineApi } from '../../api';
import { getChatSocket, disconnectChatSocket } from '../../api/chat';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';

interface ChatMsg {
  id: string;
  senderId: string;
  sender?: { fullName: string };
  content: string;
  createdAt: string;
}

export default function TeleconsultaPage() {
  const { id: appointmentId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [roomInfo, setRoomInfo] = useState<{ roomId: string; meetingUrl: string } | null>(null);
  const [dailyToken, setDailyToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!appointmentId) return;

    telemedicineApi.getOrCreateRoom(appointmentId)
      .then(async ({ data }) => {
        setRoomInfo(data);
        const tokenRes = await telemedicineApi.getToken(appointmentId);
        setDailyToken(tokenRes.data.token);

        const socket = getChatSocket();

        socket.on('connect', () => {
          socket.emit('joinRoom', data.roomId);
        });

        socket.on('history', (history: ChatMsg[]) => {
          setMessages(history);
        });

        socket.on('message', (msg: ChatMsg) => {
          setMessages((prev) => [...prev, msg]);
        });

        socket.on('typing', () => {
          setTyping(true);
          clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setTyping(false), 2000);
        });

        if (socket.connected) {
          socket.emit('joinRoom', data.roomId);
        }
      })
      .catch(() => setError('Não foi possível entrar na sala. Verifique se a consulta existe.'))
      .finally(() => setLoading(false));

    return () => {
      if (roomInfo?.roomId) {
        getChatSocket().emit('leaveRoom', roomInfo.roomId);
      }
      disconnectChatSocket();
    };
  }, [appointmentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !roomInfo) return;
    getChatSocket().emit('sendMessage', { roomId: roomInfo.roomId, content: input.trim() });
    setInput('');
  }, [input, roomInfo]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (roomInfo) {
      getChatSocket().emit('typing', roomInfo.roomId);
    }
  };

  const videoSrc = dailyToken
    ? `${roomInfo?.meetingUrl}?t=${dailyToken}`
    : roomInfo?.meetingUrl;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-400">Entrando na sala…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <Link to="/appointments"><Button variant="outline">Voltar</Button></Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-4 overflow-hidden">
      {/* Vídeo */}
      <div className="flex flex-col flex-1 gap-2">
        <div className="flex items-center justify-between">
          <Link to="/appointments" className="text-sm text-indigo-600 hover:underline">← Voltar</Link>
          <Button
            variant={videoVisible ? 'danger' : 'secondary'}
            className="text-xs"
            onClick={() => setVideoVisible((v) => !v)}
          >
            {videoVisible ? '📵 Encerrar vídeo' : '📹 Iniciar vídeo'}
          </Button>
        </div>

        {videoVisible && videoSrc ? (
          <iframe
            src={videoSrc}
            allow="camera; microphone; fullscreen; display-capture"
            className="flex-1 rounded-xl border border-gray-200 bg-gray-900 w-full"
            title="Teleconsulta"
          />
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
            <div className="text-center">
              <p className="text-4xl mb-2">📹</p>
              <p className="text-sm text-gray-400">Clique em "Iniciar vídeo" para entrar na chamada</p>
              {roomInfo && (
                <p className="text-xs text-gray-300 mt-1 font-mono">{roomInfo.roomId}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chat */}
      <div className="flex w-80 flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <p className="text-sm font-semibold text-gray-800">💬 Chat da consulta</p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    isMe ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {msg.content}
                </div>
                <p className="text-xs text-gray-300 mt-0.5">
                  {msg.sender?.fullName ?? (isMe ? 'Você' : 'Outro')} ·{' '}
                  {format(new Date(msg.createdAt), 'HH:mm', { locale: ptBR })}
                </p>
              </div>
            );
          })}
          {typing && (
            <div className="flex items-start">
              <div className="bg-gray-100 rounded-2xl px-3 py-2 text-xs text-gray-400 italic">
                digitando…
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-100 p-3 flex gap-2">
          <textarea
            className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            rows={1}
            placeholder="Digite uma mensagem…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button onClick={sendMessage} disabled={!input.trim()} className="px-3 py-2">
            ➤
          </Button>
        </div>
      </div>
    </div>
  );
}
