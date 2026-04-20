import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Colors, Spacing, Typography, Radius } from '../../theme';
import { appointmentsApi, telemedicineApi } from '../../services/api';
import { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Tab = 'upcoming' | 'past';

export function AppointmentsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await appointmentsApi.getAll();
      setAppointments(data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const now = new Date();
  const upcoming = appointments.filter(
    (a) => a.status !== 'cancelled' && new Date(a.scheduledAt) >= now
  );
  const past = appointments.filter(
    (a) => a.status === 'cancelled' || new Date(a.scheduledAt) < now
  );

  const shown = tab === 'upcoming' ? upcoming : past;

  const handleCancel = (id: string) => {
    Alert.alert(t('appointments.cancel'), t('appointments.cancelConfirm'), [
      { text: t('common.no'), style: 'cancel' },
      {
        text: t('common.yes'),
        style: 'destructive',
        onPress: async () => {
          try {
            await appointmentsApi.cancel(id);
            await load();
          } catch {
            Alert.alert('Erro', t('common.error'));
          }
        },
      },
    ]);
  };

  const handleJoin = async (appt: any) => {
    setJoiningId(appt.id);
    try {
      const { meetingUrl } = await telemedicineApi.getOrCreateRoom(appt.id);
      navigation.navigate('Teleconsulta', { appointmentId: appt.id, meetingUrl });
    } catch {
      Alert.alert('Erro', 'Não foi possível entrar na sala.');
    } finally {
      setJoiningId(null);
    }
  };

  const statusColor = (status: string) => {
    if (status === 'confirmed') return Colors.secondary;
    if (status === 'cancelled') return Colors.danger;
    return Colors.warning;
  };

  const statusBg = (status: string) => {
    if (status === 'confirmed') return '#E8F8EF';
    if (status === 'cancelled') return '#FEE2E2';
    return '#FEF9EC';
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'upcoming' && styles.tabActive]}
          onPress={() => setTab('upcoming')}
        >
          <Text style={[styles.tabLabel, tab === 'upcoming' && styles.tabLabelActive]}>
            {t('appointments.upcoming')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'past' && styles.tabActive]}
          onPress={() => setTab('past')}
        >
          <Text style={[styles.tabLabel, tab === 'past' && styles.tabLabelActive]}>
            {t('appointments.past')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {shown.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={56} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              {tab === 'upcoming' ? t('appointments.noUpcoming') : t('appointments.noPast')}
            </Text>
          </View>
        ) : (
          shown.map((appt, i) => (
            <View key={appt.id ?? i} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.doctorRow}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={22} color={Colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.doctorName}>Dr(a). {appt.doctorName ?? 'Médico'}</Text>
                    <Text style={styles.specialty}>{appt.specialty ?? 'Clínica Geral'}</Text>
                  </View>
                </View>
                <View style={[styles.badge, { backgroundColor: statusBg(appt.status) }]}>
                  <Text style={[styles.badgeText, { color: statusColor(appt.status) }]}>
                    {t(`appointments.status.${appt.status}` as any)}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.timeRow}>
                <Ionicons name="calendar" size={16} color={Colors.textSecondary} />
                <Text style={styles.timeText}>
                  {format(new Date(appt.scheduledAt ?? Date.now()), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </Text>
              </View>
              <View style={styles.timeRow}>
                <Ionicons name="time" size={16} color={Colors.textSecondary} />
                <Text style={styles.timeText}>
                  {format(new Date(appt.scheduledAt ?? Date.now()), 'HH:mm')}
                </Text>
              </View>

              {tab === 'upcoming' && appt.status !== 'cancelled' && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.joinBtn, joiningId === appt.id && styles.joinBtnDisabled]}
                    onPress={() => handleJoin(appt)}
                    disabled={joiningId === appt.id}
                  >
                    <Ionicons name="videocam" size={16} color="#fff" />
                    <Text style={styles.joinBtnText}>
                      {joiningId === appt.id ? 'Entrando…' : t('appointments.joinVideo')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleCancel(appt.id)}
                  >
                    <Text style={styles.cancelBtnText}>{t('appointments.cancel')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabs: { flexDirection: 'row', backgroundColor: Colors.surface, paddingHorizontal: Spacing.md },
  tab: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabLabel: { ...Typography.body, color: Colors.textMuted },
  tabLabelActive: { color: Colors.primary, fontWeight: '600' },
  list: { padding: Spacing.md, paddingBottom: Spacing.xl },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyText: { ...Typography.body, color: Colors.textMuted },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  doctorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: {
    width: 44, height: 44, borderRadius: Radius.full,
    backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center',
  },
  doctorName: { ...Typography.body, fontWeight: '600', color: Colors.textPrimary },
  specialty: { ...Typography.caption, color: Colors.textSecondary },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  badgeText: { ...Typography.label },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 6 },
  timeText: { ...Typography.body, color: Colors.textSecondary },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  joinBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.sm,
  },
  joinBtnDisabled: { opacity: 0.6 },
  joinBtnText: { ...Typography.label, color: '#fff' },
  cancelBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.danger,
  },
  cancelBtnText: { ...Typography.label, color: Colors.danger },
});
