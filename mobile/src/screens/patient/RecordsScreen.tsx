import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
  TextInput, Switch, Alert, RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Colors, Spacing, Typography, Radius } from '../../theme';
import { Button } from '../../components/Button';
import { recordsApi } from '../../services/api';

type Tab = 'mood' | 'symptoms' | 'medication';

export function RecordsScreen() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('mood');
  const [moods, setMoods] = useState<any[]>([]);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState<Tab | null>(null);

  const load = useCallback(async () => {
    try {
      const [m, s, med] = await Promise.all([
        recordsApi.getMoods(),
        recordsApi.getSymptoms(),
        recordsApi.getMedications(),
      ]);
      setMoods(m);
      setSymptoms(s);
      setMedications(med);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const moodLabels = t('records.moodScore');
  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'mood', label: t('records.mood'), icon: 'heart' },
    { key: 'symptoms', label: t('records.symptoms'), icon: 'fitness' },
    { key: 'medication', label: t('records.medication'), icon: 'medical' },
  ];

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabs}>
        {tabs.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[styles.tab, tab === tb.key && styles.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Ionicons name={tb.icon} size={18} color={tab === tb.key ? Colors.primary : Colors.textMuted} />
            <Text style={[styles.tabLabel, tab === tb.key && styles.tabLabelActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {tab === 'mood' && (
          <>
            {moods.length === 0
              ? <EmptyState icon="heart-outline" text={t('dashboard.noRecords')} />
              : moods.map((m, i) => (
                <RecordCard key={i}>
                  <View style={styles.rowBetween}>
                    <View style={styles.row}>
                      <View style={[styles.scoreDot, { backgroundColor: Colors.moodColors[m.score - 1] }]}>
                        <Text style={styles.scoreText}>{m.score}</Text>
                      </View>
                      <View>
                        <Text style={styles.recordTitle}>{m.label}</Text>
                        <Text style={styles.recordDate}>{format(new Date(m.createdAt ?? Date.now()), "dd/MM 'às' HH:mm", { locale: ptBR })}</Text>
                      </View>
                    </View>
                    {m.isPrivate && <Ionicons name="lock-closed" size={14} color={Colors.textMuted} />}
                  </View>
                </RecordCard>
              ))
            }
          </>
        )}

        {tab === 'symptoms' && (
          <>
            {symptoms.length === 0
              ? <EmptyState icon="fitness-outline" text={t('dashboard.noRecords')} />
              : symptoms.map((s, i) => (
                <RecordCard key={i}>
                  <View style={styles.rowBetween}>
                    <View>
                      <Text style={styles.recordTitle}>{s.symptom}</Text>
                      <Text style={styles.recordDate}>{format(new Date(s.createdAt ?? Date.now()), "dd/MM 'às' HH:mm", { locale: ptBR })}</Text>
                    </View>
                    <View style={[styles.severityBadge, severityStyle(s.severity)]}>
                      <Text style={[styles.severityText, severityTextStyle(s.severity)]}>
                        {s.severity === 'low' ? t('records.severityLow') : s.severity === 'medium' ? t('records.severityMedium') : t('records.severityHigh')}
                      </Text>
                    </View>
                  </View>
                </RecordCard>
              ))
            }
          </>
        )}

        {tab === 'medication' && (
          <>
            {medications.length === 0
              ? <EmptyState icon="medical-outline" text={t('dashboard.noRecords')} />
              : medications.map((m, i) => (
                <RecordCard key={i}>
                  <View style={styles.rowBetween}>
                    <View>
                      <Text style={styles.recordTitle}>{m.name}</Text>
                      <Text style={styles.recordSub}>{m.dose}</Text>
                      <Text style={styles.recordDate}>{format(new Date(m.createdAt ?? Date.now()), "dd/MM 'às' HH:mm", { locale: ptBR })}</Text>
                    </View>
                    <View style={[styles.takenBadge, { backgroundColor: m.taken ? '#E8F8EF' : '#FEE2E2' }]}>
                      <Ionicons name={m.taken ? 'checkmark-circle' : 'close-circle'} size={20} color={m.taken ? Colors.secondary : Colors.danger} />
                    </View>
                  </View>
                </RecordCard>
              ))
            }
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModal(tab)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add modals */}
      {modal === 'mood' && <AddMoodModal onClose={() => setModal(null)} onSaved={load} />}
      {modal === 'symptoms' && <AddSymptomModal onClose={() => setModal(null)} onSaved={load} />}
      {modal === 'medication' && <AddMedicationModal onClose={() => setModal(null)} onSaved={load} />}
    </View>
  );
}

function RecordCard({ children }: { children: React.ReactNode }) {
  return <View style={cardStyles.card}>{children}</View>;
}

function EmptyState({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={emptyStyles.wrap}>
      <Ionicons name={icon} size={48} color={Colors.textMuted} />
      <Text style={emptyStyles.text}>{text}</Text>
    </View>
  );
}

function AddMoodModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const [score, setScore] = useState(3);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const moodLabels = t('dashboard.moodLabels', { returnObjects: true }) as string[];
  const MOOD_ICONS: any[] = ['sad', 'sad-outline', 'help-circle-outline', 'happy-outline', 'happy'];

  const save = async () => {
    setLoading(true);
    try {
      await recordsApi.createMood({ score, label: moodLabels[score - 1], isPrivate });
      onSaved();
      onClose();
    } catch { Alert.alert('Erro', 'Não foi possível salvar.'); }
    finally { setLoading(false); }
  };

  return (
    <BottomModal title={t('records.addMood')} onClose={onClose}>
      <View style={modalStyles.moodRow}>
        {[1, 2, 3, 4, 5].map((s) => (
          <TouchableOpacity key={s} onPress={() => setScore(s)} style={[modalStyles.moodBtn, score === s && modalStyles.moodBtnActive]}>
            <Ionicons name={MOOD_ICONS[s - 1]} size={32} color={score === s ? Colors.primary : Colors.textMuted} />
            <Text style={[modalStyles.moodLabel, score === s && { color: Colors.primary }]}>{moodLabels[s - 1]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <PrivateToggle value={isPrivate} onChange={setIsPrivate} />
      <Button label={t('common.save')} onPress={save} loading={loading} />
    </BottomModal>
  );
}

function AddSymptomModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const [symptom, setSymptom] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('low');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!symptom.trim()) return;
    setLoading(true);
    try {
      await recordsApi.createSymptom({ symptom, severity, isPrivate });
      onSaved();
      onClose();
    } catch { Alert.alert('Erro', 'Não foi possível salvar.'); }
    finally { setLoading(false); }
  };

  return (
    <BottomModal title={t('records.addSymptom')} onClose={onClose}>
      <TextInput
        style={modalStyles.textInput}
        placeholder={t('records.symptomName')}
        value={symptom}
        onChangeText={setSymptom}
        placeholderTextColor={Colors.textMuted}
      />
      <Text style={modalStyles.fieldLabel}>{t('records.severity')}</Text>
      <View style={modalStyles.severityRow}>
        {(['low', 'medium', 'high'] as const).map((sv) => (
          <TouchableOpacity
            key={sv}
            style={[modalStyles.severityBtn, severity === sv && modalStyles.severityBtnActive]}
            onPress={() => setSeverity(sv)}
          >
            <Text style={[modalStyles.severityBtnText, severity === sv && { color: Colors.primary }]}>
              {sv === 'low' ? t('records.severityLow') : sv === 'medium' ? t('records.severityMedium') : t('records.severityHigh')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <PrivateToggle value={isPrivate} onChange={setIsPrivate} />
      <Button label={t('common.save')} onPress={save} loading={loading} disabled={!symptom.trim()} />
    </BottomModal>
  );
}

function AddMedicationModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [taken, setTaken] = useState(true);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await recordsApi.createMedication({ name, dose, taken });
      onSaved();
      onClose();
    } catch { Alert.alert('Erro', 'Não foi possível salvar.'); }
    finally { setLoading(false); }
  };

  return (
    <BottomModal title={t('records.addMedication')} onClose={onClose}>
      <TextInput
        style={modalStyles.textInput}
        placeholder={t('records.medicationName')}
        value={name}
        onChangeText={setName}
        placeholderTextColor={Colors.textMuted}
      />
      <TextInput
        style={[modalStyles.textInput, { marginTop: Spacing.sm }]}
        placeholder={t('records.dose')}
        value={dose}
        onChangeText={setDose}
        placeholderTextColor={Colors.textMuted}
      />
      <View style={modalStyles.toggleRow}>
        <Text style={modalStyles.fieldLabel}>{t('records.taken')}</Text>
        <Switch value={taken} onValueChange={setTaken} trackColor={{ true: Colors.secondary }} />
      </View>
      <Button label={t('common.save')} onPress={save} loading={loading} disabled={!name.trim()} />
    </BottomModal>
  );
}

function BottomModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal transparent animationType="slide">
      <TouchableOpacity style={modalStyles.overlay} onPress={onClose} activeOpacity={1} />
      <View style={modalStyles.sheet}>
        <View style={modalStyles.handle} />
        <View style={modalStyles.sheetHeader}>
          <Text style={modalStyles.sheetTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        {children}
      </View>
    </Modal>
  );
}

function PrivateToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const { t } = useTranslation();
  return (
    <View style={modalStyles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={modalStyles.fieldLabel}>{t('records.private')}</Text>
        <Text style={modalStyles.fieldHint}>{t('records.privateInfo')}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: Colors.primary }} />
    </View>
  );
}

const severityStyle = (s: string) => ({
  backgroundColor: s === 'low' ? '#E8F8EF' : s === 'medium' ? '#FEF9EC' : '#FEE2E2',
});
const severityTextStyle = (s: string) => ({
  color: s === 'low' ? Colors.secondary : s === 'medium' ? Colors.warning : Colors.danger,
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabs: { flexDirection: 'row', backgroundColor: Colors.surface, paddingHorizontal: Spacing.md },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.md, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabLabel: { ...Typography.caption, color: Colors.textMuted },
  tabLabelActive: { color: Colors.primary, fontWeight: '600' },
  list: { padding: Spacing.md, paddingBottom: 100 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreDot: { width: 40, height: 40, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  scoreText: { ...Typography.body, color: '#fff', fontWeight: '700' },
  recordTitle: { ...Typography.body, fontWeight: '600', color: Colors.textPrimary },
  recordSub: { ...Typography.caption, color: Colors.textSecondary },
  recordDate: { ...Typography.caption, color: Colors.textMuted },
  severityBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  severityText: { ...Typography.label },
  takenBadge: { width: 40, height: 40, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: Radius.full,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
});

const emptyStyles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  text: { ...Typography.body, color: Colors.textMuted },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl ?? 24, borderTopRightRadius: Radius.xl ?? 24,
    padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.sm },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { ...Typography.h3, color: Colors.textPrimary },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodBtn: { alignItems: 'center', flex: 1, padding: Spacing.xs, borderRadius: Radius.md },
  moodBtnActive: { backgroundColor: '#EBF4FF' },
  moodLabel: { ...Typography.caption, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
  textInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    padding: Spacing.md, ...Typography.body, color: Colors.textPrimary,
  },
  fieldLabel: { ...Typography.label, color: Colors.textSecondary, marginBottom: 4 },
  fieldHint: { ...Typography.caption, color: Colors.textMuted },
  severityRow: { flexDirection: 'row', gap: Spacing.sm },
  severityBtn: {
    flex: 1, paddingVertical: Spacing.sm, alignItems: 'center',
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border,
  },
  severityBtnActive: { borderColor: Colors.primary, backgroundColor: '#EBF4FF' },
  severityBtnText: { ...Typography.label, color: Colors.textSecondary },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
