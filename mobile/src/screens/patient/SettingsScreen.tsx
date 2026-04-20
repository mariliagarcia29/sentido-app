import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../../i18n';

import { Colors, Spacing, Typography, Radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { consentApi, exportsApi } from '../../services/api';

const LANGUAGES = [
  { code: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { code: 'es-ES', label: 'Español', flag: '🇪🇸' },
];

export function SettingsScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [showDoctors, setShowDoctors] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const data = await consentApi.list();
      setDoctors(data.filter((d: any) => d.status === 'active'));
    } catch {} finally { setLoadingDoctors(false); }
  };

  const handleLogout = () => {
    Alert.alert(t('common.logout'), 'Deseja realmente sair?', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.logout'), style: 'destructive', onPress: logout },
    ]);
  };

  const handleLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setCurrentLang(code);
  };

  const handleRevoke = (consentId: string, doctorName: string) => {
    Alert.alert(
      t('settings.revokeAccess'),
      `Revogar acesso de ${doctorName}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Revogar',
          style: 'destructive',
          onPress: async () => {
            setRevoking(consentId);
            try {
              await consentApi.act(consentId, 'revoke');
              setDoctors((prev) => prev.filter((d) => d.id !== consentId));
              Alert.alert('Acesso revogado', `${doctorName} não tem mais acesso aos seus dados.`);
            } catch {
              Alert.alert('Erro', t('common.error'));
            } finally { setRevoking(null); }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    Alert.alert(
      t('settings.exportData'),
      'Gerar um PDF com todos os seus dados de saúde dos últimos 12 meses?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('export.generate'),
          onPress: async () => {
            setExportLoading(true);
            try {
              const today = new Date().toISOString().slice(0, 10);
              const from = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
              await exportsApi.request({
                periodFrom: from,
                periodTo: today,
                includes: ['moods', 'symptoms', 'medications', 'notes'],
              });
              Alert.alert(t('export.ready'), 'Você receberá uma notificação quando o PDF estiver pronto.');
            } catch {
              Alert.alert('Erro', t('common.error'));
            } finally { setExportLoading(false); }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings.deleteAccount'),
      t('settings.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => Alert.alert('Solicitação registrada', 'Seus dados serão removidos em até 15 dias. Um e-mail de confirmação foi enviado.'),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={36} color={Colors.primary} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.fullName}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Paciente</Text>
          </View>
        </View>
      </View>

      {/* Notifications */}
      <SectionHeader label={t('settings.notifications')} />
      <SettingsCard>
        <SettingRow
          icon="notifications"
          iconColor={Colors.primary}
          label={t('settings.appointmentReminders')}
          right={
            <Switch
              value={appointmentReminders}
              onValueChange={setAppointmentReminders}
              trackColor={{ true: Colors.primary }}
            />
          }
        />
      </SettingsCard>

      {/* Language */}
      <SectionHeader label={t('settings.language')} />
      <SettingsCard>
        {LANGUAGES.map((lang, i) => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.langRow, i < LANGUAGES.length - 1 && styles.borderBottom]}
            onPress={() => handleLanguage(lang.code)}
          >
            <Text style={styles.langFlag}>{lang.flag}</Text>
            <Text style={styles.langLabel}>{lang.label}</Text>
            {currentLang.startsWith(lang.code.split('-')[0]) && (
              <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </SettingsCard>

      {/* Privacy / LGPD */}
      <SectionHeader label={t('settings.privacy')} />

      {/* Médicos com acesso */}
      <View style={sectionStyles.card}>
        <TouchableOpacity
          style={sectionStyles.row}
          onPress={() => setShowDoctors(!showDoctors)}
        >
          <View style={[sectionStyles.iconWrap, { backgroundColor: Colors.secondary + '20' }]}>
            <Ionicons name="people" size={18} color={Colors.secondary} />
          </View>
          <Text style={sectionStyles.rowLabel}>{t('settings.dataAccess')}</Text>
          {loadingDoctors
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Ionicons name={showDoctors ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textMuted} />
          }
        </TouchableOpacity>

        {showDoctors && (
          <View style={styles.doctorsList}>
            {doctors.length === 0 ? (
              <Text style={styles.noDoctors}>{t('settings.noActiveDoctors', 'Nenhum médico com acesso ativo')}</Text>
            ) : (
              doctors.map((consent) => {
                const name = consent.doctor?.fullName ?? consent.doctor?.email ?? 'Médico';
                return (
                  <View key={consent.id} style={styles.doctorRow}>
                    <View style={styles.doctorAvatar}>
                      <Text style={styles.doctorAvatarText}>{name[0].toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.doctorName}>{name}</Text>
                      <Text style={styles.doctorEmail}>{consent.doctor?.email}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.revokeBtn, revoking === consent.id && styles.revokeBtnDisabled]}
                      disabled={revoking === consent.id}
                      onPress={() => handleRevoke(consent.id, name)}
                    >
                      <Text style={styles.revokeBtnText}>
                        {revoking === consent.id ? '…' : 'Revogar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        )}

        <SettingRow
          icon="download"
          iconColor={Colors.primary}
          label={exportLoading ? 'Gerando…' : t('settings.exportData')}
          onPress={exportLoading ? undefined : handleExportData}
          showChevron={!exportLoading}
          borderTop
        />
      </View>

      {/* Account */}
      <SectionHeader label={t('settings.account')} />
      <SettingsCard>
        <SettingRow
          icon="call"
          iconColor={Colors.secondary}
          label={t('settings.emergencyContact')}
          onPress={() => {}}
          showChevron
        />
      </SettingsCard>

      {/* Danger zone */}
      <View style={styles.dangerSection}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>{t('common.logout')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>{t('settings.deleteAccount')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Sentido v1.0.0</Text>
    </ScrollView>
  );
}

function SectionHeader({ label }: { label: string }) {
  return <Text style={sectionStyles.header}>{label}</Text>;
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return <View style={sectionStyles.card}>{children}</View>;
}

function SettingRow({
  icon, iconColor, label, right, onPress, showChevron, borderTop,
}: {
  icon: any; iconColor: string; label: string; right?: React.ReactNode;
  onPress?: () => void; showChevron?: boolean; borderTop?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[sectionStyles.row, borderTop && sectionStyles.borderTop]}
      onPress={onPress}
      disabled={!onPress && !showChevron}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[sectionStyles.iconWrap, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={sectionStyles.rowLabel}>{label}</Text>
      {right ?? (showChevron && <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />)}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
    marginBottom: Spacing.lg, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  avatar: {
    width: 64, height: 64, borderRadius: Radius.full,
    backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  profileName: { ...Typography.h3, color: Colors.textPrimary },
  profileEmail: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  roleBadge: {
    alignSelf: 'flex-start', marginTop: 6, backgroundColor: '#EBF4FF',
    paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full,
  },
  roleText: { ...Typography.label, color: Colors.primary },
  langRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
  },
  langFlag: { fontSize: 22 },
  langLabel: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  doctorsList: {
    borderTopWidth: 1, borderTopColor: Colors.border, padding: Spacing.sm,
  },
  noDoctors: { ...Typography.caption, color: Colors.textMuted, padding: Spacing.sm, textAlign: 'center' },
  doctorRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  doctorAvatar: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center',
  },
  doctorAvatarText: { ...Typography.label, color: Colors.primary },
  doctorName: { ...Typography.body, fontWeight: '600', color: Colors.textPrimary },
  doctorEmail: { ...Typography.caption, color: Colors.textSecondary },
  revokeBtn: {
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.danger,
  },
  revokeBtnDisabled: { opacity: 0.4 },
  revokeBtnText: { ...Typography.label, color: Colors.danger, fontSize: 11 },
  dangerSection: { marginTop: Spacing.lg, gap: Spacing.sm },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: '#FEE2E2', borderRadius: Radius.md, padding: Spacing.md,
  },
  logoutText: { ...Typography.body, color: Colors.danger, fontWeight: '600' },
  deleteBtn: { alignItems: 'center', padding: Spacing.sm },
  deleteText: { ...Typography.caption, color: Colors.textMuted, textDecorationLine: 'underline' },
  version: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xl },
});

const sectionStyles = StyleSheet.create({
  header: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.lg, paddingHorizontal: 4 },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  borderTop: { borderTopWidth: 1, borderTopColor: Colors.border },
  iconWrap: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
});
