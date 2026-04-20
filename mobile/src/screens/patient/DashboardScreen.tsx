import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Colors, Spacing, Typography, Radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { recordsApi, appointmentsApi } from '../../services/api';

const MOOD_ICONS: Array<keyof typeof Ionicons.glyphMap> = [
  'sad', 'sad-outline', 'help-circle-outline', 'happy-outline', 'happy',
];

export function DashboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [moods, setMoods] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [savingMood, setSavingMood] = useState(false);

  const firstName = user?.fullName?.split(' ')[0] ?? '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const load = async () => {
    try {
      const [m, a] = await Promise.all([recordsApi.getMoods(), appointmentsApi.getMine()]);
      setMoods(m.slice(0, 5));
      setAppointments(a.filter((ap: any) => ap.status !== 'cancelled').slice(0, 3));
    } catch {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const saveMood = async (score: number) => {
    setSelectedMood(score);
    setSavingMood(true);
    try {
      const labels = t('dashboard.moodLabels', { returnObjects: true }) as string[];
      await recordsApi.createMood({ score, label: labels[score - 1], isPrivate: false });
      await load();
    } catch {} finally {
      setSavingMood(false);
    }
  };

  const moodLabels = t('dashboard.moodLabels', { returnObjects: true }) as string[];
  const upcomingAppt = appointments[0];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.name}>{firstName} 👋</Text>
        </View>
        <Text style={styles.date}>{format(new Date(), "dd 'de' MMMM", { locale: ptBR })}</Text>
      </View>

      {/* Mood Check-in */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('dashboard.todayMood')}</Text>
        <View style={styles.moodRow}>
          {[1, 2, 3, 4, 5].map((score) => (
            <TouchableOpacity
              key={score}
              style={[styles.moodBtn, selectedMood === score && styles.moodBtnActive]}
              onPress={() => saveMood(score)}
              disabled={savingMood}
            >
              <Ionicons
                name={MOOD_ICONS[score - 1]}
                size={32}
                color={selectedMood === score ? Colors.primary : Colors.textMuted}
              />
              <Text style={[styles.moodLabel, selectedMood === score && styles.moodLabelActive]}>
                {moodLabels[score - 1]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.quickRow}>
        <QuickAction icon="fitness" label={t('dashboard.logSymptom')} color={Colors.danger} onPress={() => {}} />
        <QuickAction icon="medical" label={t('dashboard.logMedication')} color={Colors.secondary} onPress={() => {}} />
        <QuickAction icon="create" label="Nota" color={Colors.warning} onPress={() => {}} />
      </View>

      {/* Upcoming appointment */}
      {upcomingAppt && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('dashboard.upcomingAppointments')}</Text>
          <View style={styles.apptRow}>
            <View style={styles.apptIcon}>
              <Ionicons name="videocam" size={22} color={Colors.primary} />
            </View>
            <View style={styles.apptInfo}>
              <Text style={styles.apptDoctor}>Dr. {upcomingAppt.doctorName}</Text>
              <Text style={styles.apptTime}>
                {format(new Date(upcomingAppt.scheduledAt), "dd/MM 'às' HH:mm")}
              </Text>
            </View>
            <View style={[styles.apptBadge, { backgroundColor: upcomingAppt.status === 'confirmed' ? '#E8F8EF' : '#FEF9EC' }]}>
              <Text style={[styles.apptBadgeText, { color: upcomingAppt.status === 'confirmed' ? Colors.secondary : Colors.warning }]}>
                {upcomingAppt.status === 'confirmed' ? 'Confirmada' : 'Pendente'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Recent mood trend */}
      {moods.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('dashboard.moodTrend')}</Text>
          <View style={styles.trendRow}>
            {moods.map((m, i) => (
              <View key={i} style={styles.trendItem}>
                <View style={[styles.trendBar, { height: (m.score / 5) * 60, backgroundColor: Colors.moodColors[m.score - 1] }]} />
                <Text style={styles.trendDay}>{format(new Date(m.createdAt ?? Date.now()), 'EEE', { locale: ptBR })}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {moods.length === 0 && appointments.length === 0 && (
        <View style={styles.emptyCard}>
          <Ionicons name="leaf-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>{t('dashboard.noRecords')}</Text>
          <Text style={styles.emptySubtext}>Comece registrando como você está se sentindo hoje.</Text>
        </View>
      )}
    </ScrollView>
  );
}

function QuickAction({ icon, label, color, onPress }: { icon: any; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.quickIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  greeting: { ...Typography.body, color: Colors.textSecondary },
  name: { ...Typography.h2, color: Colors.textPrimary },
  date: { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.md },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodBtn: { alignItems: 'center', padding: Spacing.xs, borderRadius: Radius.md, flex: 1 },
  moodBtnActive: { backgroundColor: '#EBF4FF' },
  moodLabel: { ...Typography.caption, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
  moodLabelActive: { color: Colors.primary },
  quickRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  quickAction: { flex: 1, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md },
  quickIcon: { width: 48, height: 48, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  quickLabel: { ...Typography.caption, color: Colors.textPrimary, textAlign: 'center' },
  apptRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  apptIcon: { width: 44, height: 44, borderRadius: Radius.full, backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center' },
  apptInfo: { flex: 1 },
  apptDoctor: { ...Typography.body, fontWeight: '600', color: Colors.textPrimary },
  apptTime: { ...Typography.caption, color: Colors.textSecondary },
  apptBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  apptBadgeText: { ...Typography.label },
  trendRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, height: 80 },
  trendItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  trendBar: { width: '70%', borderRadius: Radius.sm, minHeight: 4 },
  trendDay: { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },
  emptyCard: { alignItems: 'center', padding: Spacing.xl, gap: Spacing.sm },
  emptyText: { ...Typography.h3, color: Colors.textMuted },
  emptySubtext: { ...Typography.body, color: Colors.textMuted, textAlign: 'center' },
});
