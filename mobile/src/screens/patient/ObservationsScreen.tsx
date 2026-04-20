import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Colors, Spacing, Typography, Radius } from '../../theme';
import { observationsApi } from '../../services/api';

const severityConfig = {
  info:     { color: Colors.primary,   bg: '#EBF4FF', label: 'Info' },
  warn:     { color: Colors.warning,   bg: '#FEF9EC', label: 'Atenção' },
  critical: { color: Colors.danger,    bg: '#FEE2E2', label: 'Crítico' },
};

export function ObservationsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await observationsApi.mine();
      setItems(data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleRead = async (id: string) => {
    try {
      await observationsApi.markRead(id);
      setItems((prev) => prev.map((o) => o.id === id ? { ...o, readAt: new Date().toISOString() } : o));
    } catch {}
  };

  const cfg = (sev: string) => severityConfig[sev as keyof typeof severityConfig] ?? severityConfig.info;

  return (
    <View style={styles.container}>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={56} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Nenhuma observação ainda</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          renderItem={({ item }) => {
            const c = cfg(item.severity);
            const unread = !item.readAt;
            return (
              <View style={[styles.card, unread && styles.cardUnread]}>
                <View style={styles.row}>
                  <View style={[styles.pill, { backgroundColor: c.bg }]}>
                    <Text style={[styles.pillText, { color: c.color }]}>{c.label}</Text>
                  </View>
                  {unread && <View style={styles.dot} />}
                </View>

                <Text style={[styles.content, unread && styles.contentBold]}>{item.content}</Text>

                <View style={styles.footer}>
                  <Text style={styles.date}>
                    {format(new Date(item.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </Text>
                  {unread && (
                    <TouchableOpacity onPress={() => handleRead(item.id)} style={styles.readBtn}>
                      <Text style={styles.readBtnText}>Marcar como lida</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.md, paddingBottom: Spacing.xl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyText: { ...Typography.body, color: Colors.textMuted },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    borderLeftWidth: 3, borderLeftColor: Colors.border,
  },
  cardUnread: { borderLeftColor: Colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  pill: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full },
  pillText: { ...Typography.label, fontSize: 11 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  content: { ...Typography.body, color: Colors.textPrimary, lineHeight: 22 },
  contentBold: { fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  date: { ...Typography.caption, color: Colors.textMuted },
  readBtn: { paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  readBtnText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
});
