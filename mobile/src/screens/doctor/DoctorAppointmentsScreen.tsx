import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Colors, Spacing, Typography, Radius } from '../../theme';
import { appointmentsApi, telemedicineApi } from '../../services/api';
import { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pendente',   color: Colors.warning,   bg: '#FEF9EC' },
  confirmed: { label: 'Confirmada', color: Colors.secondary, bg: '#E8F8EF' },
  cancelled: { label: 'Cancelada',  color: Colors.textMuted, bg: '#F4F6FB' },
};

export function DoctorAppointmentsScreen() {
  const navigation = useNavigation<Nav>();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await appointmentsApi.getAll();
      setAppointments(data.sort((a: any, b: any) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      ));
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleJoin = async (appt: any) => {
    setJoiningId(appt.id);
    try {
      const { roomId, meetingUrl } = await telemedicineApi.getOrCreateRoom(appt.id);
      if (meetingUrl) {
        navigation.navigate('Teleconsulta', { appointmentId: appt.id, meetingUrl });
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível iniciar a teleconsulta.');
    } finally {
      setJoiningId(null);
    }
  };

  const now = new Date();
  const upcoming = appointments.filter((a) => a.status !== 'cancelled' && new Date(a.scheduledAt) >= now);
  const past = appointments.filter((a) => a.status === 'cancelled' || new Date(a.scheduledAt) < now);
  const sections = [
    ...(upcoming.length > 0 ? [{ type: 'header', label: 'Próximas consultas' }, ...upcoming] : []),
    ...(past.length > 0 ? [{ type: 'header', label: 'Anteriores' }, ...past] : []),
  ];

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'header') {
      return <Text style={styles.sectionHeader}>{item.label}</Text>;
    }

    const cfg = statusCfg[item.status] ?? statusCfg.pending;
    const date = new Date(item.scheduledAt);
    const isUpcoming = item.status !== 'cancelled' && date >= now;
    const isJoining = joiningId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.dateColumn}>
          <Text style={styles.dateDay}>{format(date, 'dd', { locale: ptBR })}</Text>
          <Text style={styles.dateMonth}>{format(date, 'MMM', { locale: ptBR }).toUpperCase()}</Text>
          <Text style={styles.dateTime}>{format(date, 'HH:mm')}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.patientName}>{item.patientName ?? 'Paciente'}</Text>
          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {isUpcoming && (
          <TouchableOpacity
            style={[styles.joinBtn, isJoining && styles.joinBtnDisabled]}
            onPress={() => handleJoin(item)}
            disabled={isJoining}
          >
            <Ionicons name="videocam" size={16} color="#fff" />
            <Text style={styles.joinBtnText}>{isJoining ? '...' : 'Entrar'}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <FlatList
      data={sections}
      keyExtractor={(item, idx) => item.id ?? `header-${idx}`}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Nenhuma consulta agendada</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.md, paddingBottom: 100 },
  sectionHeader: {
    ...Typography.label,
    color: Colors.textMuted,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  dateColumn: {
    alignItems: 'center',
    width: 44,
  },
  dateDay: {
    ...Typography.h2,
    color: Colors.primary,
    lineHeight: 28,
  },
  dateMonth: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
  },
  dateTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  info: { flex: 1, gap: 4 },
  patientName: { ...Typography.body, fontWeight: '600', color: Colors.textPrimary },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgeText: { ...Typography.label },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  joinBtnDisabled: { opacity: 0.5 },
  joinBtnText: { ...Typography.label, color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyText: { ...Typography.body, color: Colors.textMuted },
});
