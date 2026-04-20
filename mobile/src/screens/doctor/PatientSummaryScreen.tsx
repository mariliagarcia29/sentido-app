import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Colors, Spacing, Typography, Radius } from '../../theme';
import { doctorApi, telemedicineApi } from '../../services/api';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientSummary'>;

const severityCfg = {
  info:     { color: Colors.primary,  bg: '#EBF4FF', label: 'Info' },
  warn:     { color: Colors.warning,  bg: '#FEF9EC', label: 'Atenção' },
  critical: { color: Colors.danger,   bg: '#FEE2E2', label: 'Crítico' },
};

const SEVERITIES = ['info', 'warn', 'critical'] as const;

export function PatientSummaryScreen({ route, navigation }: Props) {
  const { patientId, patientName } = route.params;

  const [summary, setSummary] = useState<any>(null);
  const [observations, setObservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [severity, setSeverity] = useState<'info' | 'warn' | 'critical'>('info');
  const [saving, setSaving] = useState(false);
  const [joiningId, setJoiningId] = useState(false);

  const load = async () => {
    try {
      const [sum, obs] = await Promise.all([
        doctorApi.getPatientSummary(patientId),
        doctorApi.listObservations(patientId),
      ]);
      setSummary(sum);
      setObservations(obs);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [patientId]);

  const handleSaveObservation = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const obs = await doctorApi.createObservation(patientId, { content: content.trim(), severity });
      setObservations((prev) => [obs, ...prev]);
      setContent('');
      setSeverity('info');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a observação.');
    } finally {
      setSaving(false);
    }
  };

  const handleJoinCall = async (appointmentId: string) => {
    setJoiningId(true);
    try {
      const { meetingUrl } = await telemedicineApi.getOrCreateRoom(appointmentId);
      navigation.navigate('Teleconsulta', { appointmentId, meetingUrl });
    } catch {
      Alert.alert('Erro', 'Não foi possível entrar na sala.');
    } finally {
      setJoiningId(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const riskScore = summary?.riskScore ?? 0;
  const riskColor = riskScore >= 70 ? Colors.danger : riskScore >= 40 ? Colors.warning : Colors.secondary;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Perfil */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{patientName[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{patientName}</Text>
          <Text style={styles.profileEmail}>{summary?.patient?.email}</Text>
        </View>
        {summary?.nextAppointmentId && (
          <TouchableOpacity
            style={[styles.callBtn, joiningId && styles.callBtnDisabled]}
            onPress={() => handleJoinCall(summary.nextAppointmentId)}
            disabled={joiningId}
          >
            <Ionicons name="videocam" size={18} color="#fff" />
            <Text style={styles.callBtnText}>{joiningId ? '…' : 'Entrar'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Métricas */}
      <Text style={styles.sectionTitle}>Resumo clínico (7 dias)</Text>
      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { borderTopColor: riskColor }]}>
          <Text style={styles.metricLabel}>Risco</Text>
          <Text style={[styles.metricValue, { color: riskColor }]}>{riskScore}</Text>
          <View style={styles.riskBar}>
            <View style={[styles.riskFill, { width: `${Math.min(riskScore, 100)}%` as any, backgroundColor: riskColor }]} />
          </View>
        </View>
        <View style={[styles.metricCard, { borderTopColor: Colors.primary }]}>
          <Text style={styles.metricLabel}>Humor médio</Text>
          <Text style={[styles.metricValue, { color: Colors.primary }]}>
            {summary?.avgMood != null ? Number(summary.avgMood).toFixed(1) : '—'}
          </Text>
          <Text style={styles.metricSub}>de 10</Text>
        </View>
      </View>
      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { borderTopColor: Colors.danger }]}>
          <Text style={styles.metricLabel}>Med. perdidas</Text>
          <Text style={[styles.metricValue, { color: Colors.danger }]}>{summary?.missedMeds ?? 0}</Text>
          <Text style={styles.metricSub}>nos últimos 7d</Text>
        </View>
        <View style={[styles.metricCard, { borderTopColor: Colors.warning }]}>
          <Text style={styles.metricLabel}>Sintomas críticos</Text>
          <Text style={[styles.metricValue, { color: Colors.warning }]}>{summary?.criticalSymptoms ?? 0}</Text>
          <Text style={styles.metricSub}>nos últimos 7d</Text>
        </View>
      </View>

      {/* Nova observação */}
      <Text style={styles.sectionTitle}>Nova observação</Text>
      <View style={styles.obsForm}>
        <View style={styles.severityRow}>
          {SEVERITIES.map((sev) => {
            const cfg = severityCfg[sev];
            const active = severity === sev;
            return (
              <TouchableOpacity
                key={sev}
                style={[styles.sevBtn, active && { backgroundColor: cfg.bg, borderColor: cfg.color }]}
                onPress={() => setSeverity(sev)}
              >
                <Text style={[styles.sevBtnText, active && { color: cfg.color }]}>{cfg.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TextInput
          style={styles.obsInput}
          value={content}
          onChangeText={setContent}
          placeholder="Escreva sua observação clínica…"
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
        />
        <TouchableOpacity
          style={[styles.saveBtn, (!content.trim() || saving) && styles.saveBtnDisabled]}
          onPress={handleSaveObservation}
          disabled={!content.trim() || saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Salvando…' : 'Salvar observação'}</Text>
        </TouchableOpacity>
      </View>

      {/* Histórico de observações */}
      {observations.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Histórico de observações</Text>
          {observations.map((obs) => {
            const cfg = severityCfg[obs.severity as keyof typeof severityCfg] ?? severityCfg.info;
            return (
              <View key={obs.id} style={[styles.obsCard, { borderLeftColor: cfg.color }]}>
                <View style={styles.obsHeader}>
                  <View style={[styles.obsPill, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.obsPillText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                  <Text style={styles.obsDate}>
                    {format(new Date(obs.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </Text>
                </View>
                <Text style={styles.obsContent}>{obs.content}</Text>
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  profileAvatar: {
    width: 56, height: 56, borderRadius: Radius.full,
    backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center',
  },
  profileAvatarText: { ...Typography.h2, color: Colors.primary },
  profileName: { ...Typography.body, fontWeight: '700', color: Colors.textPrimary },
  profileEmail: { ...Typography.caption, color: Colors.textSecondary },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm,
  },
  callBtnDisabled: { opacity: 0.5 },
  callBtnText: { ...Typography.label, color: '#fff' },
  sectionTitle: { ...Typography.label, color: Colors.textSecondary },
  metricsRow: { flexDirection: 'row', gap: Spacing.sm },
  metricCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, borderTopWidth: 3,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  metricLabel: { ...Typography.caption, color: Colors.textSecondary },
  metricValue: { ...Typography.h2, marginTop: 4 },
  metricSub: { ...Typography.caption, color: Colors.textMuted },
  riskBar: {
    marginTop: 8, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, overflow: 'hidden',
  },
  riskFill: { height: 4, borderRadius: 2 },
  obsForm: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  severityRow: { flexDirection: 'row', gap: Spacing.sm },
  sevBtn: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.sm,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border,
  },
  sevBtnText: { ...Typography.label, color: Colors.textMuted },
  obsInput: {
    ...Typography.body, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    padding: Spacing.md, minHeight: 80, textAlignVertical: 'top',
    backgroundColor: Colors.background,
  },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: Spacing.sm, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { ...Typography.label, color: '#fff' },
  obsCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, borderLeftWidth: 3,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  obsHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  obsPill: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full },
  obsPillText: { ...Typography.label, fontSize: 11 },
  obsDate: { ...Typography.caption, color: Colors.textMuted },
  obsContent: { ...Typography.body, color: Colors.textPrimary, lineHeight: 22 },
});
