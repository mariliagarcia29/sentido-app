import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Colors, Spacing, Typography, Radius } from '../../theme';
import { wearablesApi } from '../../services/api';
import { readNativeHealthSamples } from '../../services/health';

const dataTypeLabel: Record<string, string> = {
  steps: 'Passos', heart_rate: 'Freq. cardíaca', sleep: 'Sono',
  glucose: 'Glicose', weight: 'Peso', calories: 'Calorias',
};
const dataTypeUnit: Record<string, string> = {
  steps: 'passos', heart_rate: 'bpm', sleep: 'min',
  glucose: 'mg/dL', weight: 'kg', calories: 'kcal',
};
const dataTypeIcon: Record<string, any> = {
  steps: 'footsteps', heart_rate: 'heart', sleep: 'moon',
  glucose: 'water', weight: 'scale', calories: 'flame',
};
const providerLabel: Record<string, string> = {
  fitbit: 'Fitbit', garmin: 'Garmin', apple: 'Apple Health',
  google: 'Google Fit', samsung: 'Samsung Health',
};

export function WearablesScreen() {
  const [connections, setConnections] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    try {
      const [conn, sum] = await Promise.all([
        wearablesApi.getConnections(),
        wearablesApi.getSummary(),
      ]);
      setConnections(conn);
      setSummary(sum);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handlePushSample = async () => {
    setSyncing(true);
    try {
      const samples = await readNativeHealthSamples();
      if (!samples.length) {
        Alert.alert('Sem dados', 'Nenhum dado de saúde encontrado nas últimas 24 horas. Verifique as permissões do app.');
        return;
      }
      await Promise.all(
        samples.map((s) =>
          wearablesApi.pushData({
            source: s.source,
            dataType: s.dataType,
            value: s.value,
            recordedAt: s.recordedAt,
          }),
        ),
      );
      await load();
      Alert.alert('Sincronizado', `${samples.length} métrica(s) enviada(s) com sucesso.`);
    } catch {
      Alert.alert('Erro', 'Não foi possível sincronizar. Verifique as permissões de saúde.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Dispositivos */}
      <Text style={styles.sectionTitle}>Dispositivos</Text>
      <View style={styles.card}>
        {(['apple', 'google', 'samsung'] as const).map((provider, i) => {
          const connected = connections.some((c) => c.provider === provider);
          const iconName = provider === 'apple' ? 'logo-apple' : provider === 'google' ? 'logo-google' : 'phone-portrait';
          const iconBg = provider === 'apple' ? '#F5F5F7' : provider === 'google' ? '#E8F5E9' : '#E3F2FD';
          const iconColor = provider === 'apple' ? '#1D1D1F' : provider === 'google' ? '#4CAF50' : '#1565C0';
          return (
            <View key={provider} style={[styles.deviceRow, i > 0 && styles.borderTop]}>
              <View style={styles.deviceLeft}>
                <View style={[styles.deviceIcon, { backgroundColor: iconBg }]}>
                  <Ionicons name={iconName} size={22} color={iconColor} />
                </View>
                <View>
                  <Text style={styles.deviceName}>{providerLabel[provider]}</Text>
                  <Text style={styles.deviceSub}>Sincronizado pelo app mobile</Text>
                </View>
              </View>
              <View style={[styles.badge, connected ? styles.badgeActive : styles.badgeGray]}>
                <Text style={[styles.badgeText, connected ? styles.badgeTextActive : styles.badgeTextGray]}>
                  {connected ? 'Ativo' : 'Inativo'}
                </Text>
              </View>
            </View>
          );
        })}

        <View style={[styles.deviceRow, styles.borderTop]}>
          <View style={styles.deviceLeft}>
            <View style={[styles.deviceIcon, { backgroundColor: '#EBF4FF' }]}>
              <Ionicons name="watch" size={22} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.deviceName}>Fitbit / Garmin</Text>
              <Text style={styles.deviceSub}>Conectar via app web Sentido</Text>
            </View>
          </View>
          <View style={[styles.badge, styles.badgeGray]}>
            <Text style={styles.badgeTextGray}>Web</Text>
          </View>
        </View>
      </View>

      {/* Push manual */}
      <TouchableOpacity
        style={[styles.syncBtn, syncing && styles.syncBtnDisabled]}
        onPress={handlePushSample}
        disabled={syncing}
      >
        <Ionicons name="sync" size={18} color="#fff" />
        <Text style={styles.syncBtnText}>{syncing ? 'Sincronizando…' : 'Sincronizar dados de saúde'}</Text>
      </TouchableOpacity>

      {/* Métricas */}
      {summary.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Últimos 7 dias</Text>
          <View style={styles.metricsGrid}>
            {summary.map((item) => (
              <View key={item.dataType} style={styles.metricCard}>
                <View style={styles.metricIcon}>
                  <Ionicons
                    name={dataTypeIcon[item.dataType] ?? 'stats-chart'}
                    size={22}
                    color={Colors.primary}
                  />
                </View>
                <Text style={styles.metricLabel}>{dataTypeLabel[item.dataType] ?? item.dataType}</Text>
                <Text style={styles.metricValue}>
                  {Number(item.latest).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                </Text>
                <Text style={styles.metricUnit}>{dataTypeUnit[item.dataType] ?? ''}</Text>
                <Text style={styles.metricAvg}>
                  Média 7d: {Number(item.avg).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                </Text>
                {item.lastRecordedAt && (
                  <Text style={styles.metricDate}>
                    {format(new Date(item.lastRecordedAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </>
      )}

      {summary.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="watch-outline" size={56} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Nenhum dado ainda</Text>
          <Text style={styles.emptyText}>Toque em "Sincronizar" ou conecte seu Fitbit via web.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md },
  sectionTitle: { ...Typography.label, color: Colors.textSecondary, marginBottom: -Spacing.xs },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    overflow: 'hidden',
  },
  deviceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
  borderTop: { borderTopWidth: 1, borderTopColor: Colors.border },
  deviceLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  deviceIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  deviceName: { ...Typography.body, fontWeight: '600', color: Colors.textPrimary },
  deviceSub: { ...Typography.caption, color: Colors.textMuted },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  badgeActive: { backgroundColor: '#E8F8EF' },
  badgeGray: { backgroundColor: Colors.border },
  badgeText: { ...Typography.label, fontSize: 11 },
  badgeTextActive: { color: Colors.secondary },
  badgeTextGray: { color: Colors.textMuted },
  syncBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.md,
  },
  syncBtnDisabled: { opacity: 0.6 },
  syncBtnText: { ...Typography.label, color: '#fff' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  metricCard: {
    width: '47%', backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  metricIcon: {
    width: 40, height: 40, borderRadius: Radius.md, backgroundColor: '#EBF4FF',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs,
  },
  metricLabel: { ...Typography.caption, color: Colors.textSecondary },
  metricValue: { ...Typography.h2, color: Colors.primary, marginTop: 2 },
  metricUnit: { ...Typography.caption, color: Colors.textMuted },
  metricAvg: { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },
  metricDate: { ...Typography.caption, color: Colors.border, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { ...Typography.h3, color: Colors.textSecondary },
  emptyText: { ...Typography.body, color: Colors.textMuted, textAlign: 'center' },
});
