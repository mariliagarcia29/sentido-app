import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, TextInput, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Colors, Spacing, Typography, Radius } from '../../theme';
import { consentApi } from '../../services/api';

const statusCfg = {
  pending:  { color: Colors.warning,   bg: '#FEF9EC', label: 'Pendente' },
  active:   { color: Colors.secondary, bg: '#E8F8EF', label: 'Ativo' },
  revoked:  { color: Colors.danger,    bg: '#FEE2E2', label: 'Revogado' },
};

export function ConsentScreen() {
  const [consents, setConsents] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const load = async () => {
    try {
      const data = await consentApi.list();
      setConsents(data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleInvite = async () => {
    if (!email.includes('@')) {
      Alert.alert('E-mail inválido');
      return;
    }
    setInviting(true);
    try {
      await consentApi.invite(email.trim());
      setEmail('');
      setModalVisible(false);
      await load();
      Alert.alert('Convite enviado', `Solicitação enviada para ${email.trim()}.`);
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Não foi possível enviar o convite.');
    } finally {
      setInviting(false);
    }
  };

  const handleAct = (id: string, action: 'approve' | 'revoke', label: string) => {
    Alert.alert(
      action === 'approve' ? 'Aprovar acesso' : 'Revogar acesso',
      `${label}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: action === 'approve' ? 'Aprovar' : 'Revogar',
          style: action === 'revoke' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await consentApi.act(id, action);
              await load();
            } catch {
              Alert.alert('Erro', 'Não foi possível executar a ação.');
            }
          },
        },
      ]
    );
  };

  const cfg = (status: string) => statusCfg[status as keyof typeof statusCfg] ?? statusCfg.pending;

  return (
    <View style={styles.container}>
      <FlatList
        data={consents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="shield-outline" size={56} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Nenhum consentimento registrado</Text>
          </View>
        }
        renderItem={({ item }) => {
          const c = cfg(item.status);
          const patientName = item.patient?.fullName ?? item.patient?.email ?? 'Paciente';
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{patientName[0].toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.patientName}>{patientName}</Text>
                    {item.createdAt && (
                      <Text style={styles.date}>
                        {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={[styles.badge, { backgroundColor: c.bg }]}>
                  <Text style={[styles.badgeText, { color: c.color }]}>{c.label}</Text>
                </View>
              </View>

              {item.status === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleAct(item.id, 'approve', `Aprovar acesso de ${patientName}`)}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={styles.approveBtnText}>Aprovar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.revokeBtn}
                    onPress={() => handleAct(item.id, 'revoke', `Rejeitar solicitação de ${patientName}`)}
                  >
                    <Text style={styles.revokeBtnText}>Rejeitar</Text>
                  </TouchableOpacity>
                </View>
              )}

              {item.status === 'active' && (
                <TouchableOpacity
                  style={styles.revokeBtn}
                  onPress={() => handleAct(item.id, 'revoke', `Revogar acesso de ${patientName}`)}
                >
                  <Text style={styles.revokeBtnText}>Revogar acesso</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="person-add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Modal invite */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Convidar paciente</Text>
            <Text style={styles.modalSub}>Digite o e-mail do paciente para solicitar acesso aos dados dele.</Text>

            <TextInput
              style={styles.emailInput}
              value={email}
              onChangeText={setEmail}
              placeholder="paciente@email.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inviteBtn, inviting && styles.inviteBtnDisabled]}
                onPress={handleInvite}
                disabled={inviting}
              >
                <Text style={styles.inviteBtnText}>{inviting ? 'Enviando…' : 'Enviar convite'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.md, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.sm },
  emptyText: { ...Typography.body, color: Colors.textMuted },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: {
    width: 44, height: 44, borderRadius: Radius.full,
    backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...Typography.body, fontWeight: '700', color: Colors.primary },
  patientName: { ...Typography.body, fontWeight: '600', color: Colors.textPrimary },
  date: { ...Typography.caption, color: Colors.textMuted },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  badgeText: { ...Typography.label, fontSize: 11 },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  approveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: Colors.secondary, borderRadius: Radius.md, paddingVertical: Spacing.sm,
  },
  approveBtnText: { ...Typography.label, color: '#fff' },
  revokeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.sm,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.danger,
  },
  revokeBtnText: { ...Typography.label, color: Colors.danger },
  fab: {
    position: 'absolute', right: Spacing.lg, bottom: Spacing.xl,
    width: 56, height: 56, borderRadius: Radius.full,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.lg, gap: Spacing.md,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: Spacing.sm,
  },
  modalTitle: { ...Typography.h3, color: Colors.textPrimary },
  modalSub: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22 },
  emailInput: {
    ...Typography.body, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.sm },
  cancelBtn: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.md,
    borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border,
  },
  cancelBtnText: { ...Typography.label, color: Colors.textSecondary },
  inviteBtn: {
    flex: 2, alignItems: 'center', paddingVertical: Spacing.md,
    borderRadius: Radius.lg, backgroundColor: Colors.primary,
  },
  inviteBtnDisabled: { opacity: 0.5 },
  inviteBtnText: { ...Typography.label, color: '#fff' },
});
