import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

import { RootStackParamList } from '../../navigation/types';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import { telemedicineApi } from '../../services/api';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

type Props = NativeStackScreenProps<RootStackParamList, 'Teleconsulta'>;

type Message = { id: string; senderId: string; content: string; createdAt: string };

export function TeleconsultaScreen({ route }: Props) {
  const { appointmentId, meetingUrl } = route.params;
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<FlatList>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      const userJson = await SecureStore.getItemAsync('auth_user');
      if (userJson) setUserId(JSON.parse(userJson).id);

      const { roomId: rid } = await telemedicineApi.getOrCreateRoom(appointmentId);
      if (!mounted) return;
      setRoomId(rid);

      const history = await telemedicineApi.getChatHistory(rid);
      if (mounted) setMessages(history);

      const socket = io(`${BASE_URL}/chat`, {
        auth: { token },
        transports: ['websocket'],
      });
      socketRef.current = socket;

      socket.on('connect', () => socket.emit('joinRoom', { roomId: rid }));

      socket.on('message', (msg: Message) => {
        if (mounted) setMessages((prev) => [...prev, msg]);
      });

      socket.on('typing', ({ userId: uid }: { userId: string }) => {
        if (mounted) {
          setTypingUser(uid);
          clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setTypingUser(null), 2000);
        }
      });
    };

    init().catch(() => {});

    return () => {
      mounted = false;
      socketRef.current?.disconnect();
      clearTimeout(typingTimer.current);
    };
  }, [appointmentId]);

  const sendMessage = () => {
    if (!text.trim() || !roomId || !socketRef.current) return;
    socketRef.current.emit('sendMessage', { roomId, content: text.trim() });
    setText('');
  };

  const handleTyping = (val: string) => {
    setText(val);
    if (roomId) socketRef.current?.emit('typing', { roomId });
  };

  return (
    <View style={styles.container}>
      {/* Video */}
      <View style={styles.videoContainer}>
        <WebView
          source={{ uri: meetingUrl }}
          style={styles.webview}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          )}
        />
      </View>

      {/* Chat */}
      <KeyboardAvoidingView
        style={styles.chat}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const mine = item.senderId === userId;
            return (
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                <Text style={[styles.bubbleText, mine ? styles.bubbleTextMine : styles.bubbleTextOther]}>
                  {item.content}
                </Text>
              </View>
            );
          }}
          ListFooterComponent={
            typingUser && typingUser !== userId ? (
              <Text style={styles.typing}>digitando…</Text>
            ) : null
          }
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={handleTyping}
            placeholder="Mensagem…"
            placeholderTextColor={Colors.textMuted}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!text.trim()}
          >
            <Text style={styles.sendBtnText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  videoContainer: { height: 260 },
  webview: { flex: 1 },
  webviewLoading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  chat: { flex: 1 },
  messageList: { padding: Spacing.sm, paddingBottom: Spacing.xs },
  bubble: {
    maxWidth: '75%', borderRadius: Radius.lg, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, marginBottom: Spacing.xs,
  },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: Colors.primary },
  bubbleOther: { alignSelf: 'flex-start', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  bubbleText: { ...Typography.body },
  bubbleTextMine: { color: '#fff' },
  bubbleTextOther: { color: Colors.textPrimary },
  typing: { ...Typography.caption, color: Colors.textMuted, paddingHorizontal: Spacing.sm, marginBottom: Spacing.xs },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    padding: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface,
  },
  input: {
    flex: 1, ...Typography.body, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    maxHeight: 100, backgroundColor: Colors.background,
  },
  sendBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { ...Typography.label, color: '#fff' },
});
