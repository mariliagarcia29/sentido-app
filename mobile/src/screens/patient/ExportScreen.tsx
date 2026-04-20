import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Colors, Spacing, Typography, Radius } from '../../theme';
import { Button } from '../../components/Button';
import { exportsApi } from '../../services/api';

type IncludeKey = 'moods' | 'symptoms' | 'medications';

export function ExportScreen() {
  const { t } = useTranslation();

  const [periodFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [periodTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [includes, setIncludes] = useState<Record<IncludeKey, boolean>>({
    moods: true, symptoms: true, medications: true,
  });
  const [loading, setLoading] = useState(false);
  const [exports, setExports] = useState<any[]>([]);

  useEffect(() => { loadExports(); }, []);

  const loadExports = async () => {
    try {
      const data = await exportsApi.getAll();
      setExports(data);
    } catch {}
  };

  const toggleInclude = (key: IncludeKey) =>
    setIncludes((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleGenerate = async () => {
    const selected = (Object.keys(includes) as IncludeKey[]).filter((k) => includes[k]);
    if (selected.length === 0) {
      Alert.alert('Selecione ao menos um tipo de dado.');
      return;
    }

    Alert.alert(
      '⚠️ ' + t('export.sensitiveWarning'),
      'Continuar com a exportação?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('export.generate'),
          onPress: async () => {
            setLoading(true);
            try {
              await exportsApi.request({ periodFrom, periodTo, includes: selected });
              await loadExports();
              Alert.alert(t('export.ready'), 'Você receberá uma notificação quando o PDF estiver pronto.');
            } catch {
              Alert.alert('Erro', t('common.error'));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDownload = async (id: string) => {
    try {
      const { fileUrl } = await exportsApi.download(id);
      await Linking.openURL(fileUrl);
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o arquivo.');
    }
  };

  const includeItems: { key: IncludeKey; label: string; icon: any; color: string }[] = [
    { key: 'moods', label: t('export.moods'), icon: 'heart', color: Colors.primary },
    { key: 'symptoms', label: t('export.symptoms'), icon: 'fitness', color: Colors.danger },
    { key: 'medications', label: t('export.medications'), icon: 'medical', color: Colors.secondary },
    { key: 'notes', label: t('export.notes'), icon: 'create', color: Colors.warning },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header info */}
      <View style={styles.infoCard}>
        <Ionicons name="document-text" size={28} color={Colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>{t('export.title')}</Text>
          <Text style={styles.infoSubtitle}>{t('export.subtitle')}</Text>
        </View>
      </View>

      {/* Period */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('export.period')}</Text>
        <View style={styles.periodRow}>
          <View style={styles.periodField}>
            <Text style={styles.periodLabel}>{t('export.from')}</Text>
            <Text style={styles.periodValue}>{format(new Date(periodFrom), 'dd/MM/yyyy')}</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color={Colors.textMuted} />
          <View style={styles.periodField}>
            <Text style={styles.periodLabel}>{t('export.to')}</Text>
            <Text style={styles.periodValue}>{format(new Date(periodTo), 'dd/MM/yyyy')}</Text>
          </View>
        </View>
        <Text style={styles.periodHint}>Últimos 30 dias (padrão)</Text>
      </View>

      {/* Include */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('export.include')}</Text>
        {includeItems.map((item, i) => (
          <View key={item.key} style={[styles.includeRow, i > 0 && styles.borderTop]}>
            <View style={[styles.includeIcon, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon} size={18} color={item.color} />
            </View>
            <Text style={styles.includeLabel}>{item.label}</Text>
            <Switch
              value={includes[item.key]}
              onValueChange={() => toggleInclude(item.key)}
              trackColor={{ true: Colors.primary }}
            />
          </View>
        ))}
      </View>

      <Button
        label={loading ? t('export.generating') : t('export.generate')}
        onPress={handleGenerate}
        loading={loading}
      />

      {/* Previous exports */}
      {exports.length > 0 && (
        <>
          <Text style={styles.historyTitle}>{t('export.history')}</Text>
          {exports.map((exp, i) => (
            <TouchableOpacity key={i} style={styles.exportCard} onPress={() => handleDownload(exp.id)}>
              <View style={styles.exportIcon}>
                <Ionicons name="document" size={22} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.exportDate}>
                  {format(new Date(exp.createdAt ?? Date.now()), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </Text>
                <Text style={styles.exportExpires}>{t('export.expires')}</Text>
              </View>
              <Ionicons name="download" size={20} color={Colors.primary} />
            </TouchableOpacity>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: '#EBF4FF', borderRadius: Radius.lg, padding: Spacing.md,
  },
  infoTitle: { ...Typography.h3, color: Colors.primary },
  infoSubtitle: { ...Typography.caption, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  sectionTitle: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.md },
  periodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  periodField: { alignItems: 'center' },
  periodLabel: { ...Typography.caption, color: Colors.textMuted },
  periodValue: { ...Typography.h3, color: Colors.textPrimary, marginTop: 4 },
  periodHint: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },
  includeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  borderTop: { borderTopWidth: 1, borderTopColor: Colors.border },
  includeIcon: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  includeLabel: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  historyTitle: { ...Typography.label, color: Colors.textSecondary, marginTop: Spacing.sm },
  exportCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  exportIcon: {
    width: 44, height: 44, borderRadius: Radius.full,
    backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center',
  },
  exportDate: { ...Typography.body, fontWeight: '600', color: Colors.textPrimary },
  exportExpires: { ...Typography.caption, color: Colors.textMuted },
});
