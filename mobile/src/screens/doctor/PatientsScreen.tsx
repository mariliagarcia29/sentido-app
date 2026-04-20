import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors, Spacing, Typography, Radius } from '../../theme';
import { doctorApi } from '../../services/api';
import { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const riskColor = (score: number) => {
  if (score >= 70) return Colors.danger;
  if (score >= 40) return Colors.warning;
  return Colors.secondary;
};

const riskLabel = (score: number) => {
  if (score >= 70) return 'Alto';
  if (score >= 40) return 'Moderado';
  return 'Baixo';
};

export function PatientsScreen() {
  const navigation = useNavigation<Nav>();
  const [patients, setPatients] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await doctorApi.listPatients();
      setPatients(data);
      setFiltered(data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setFiltered(patients);
    } else {
      const q = text.toLowerCase();
      setFiltered(patients.filter((p) =>
        p.fullName?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)
      ));
    }
  };

  const openSummary = (patient: any) => {
    navigation.navigate('PatientSummary', {
      patientId: patient.id,
      patientName: patient.fullName ?? patient.email,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={handleSearch}
          placeholder="Buscar paciente…"
          placeholderTextColor={Colors.textMuted}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={56} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Nenhum paciente vinculado</Text>
          </View>
        }
        renderItem={({ item }) => {
          const riskScore = item.riskScore ?? 0;
          const rc = riskColor(riskScore);
          return (
            <TouchableOpacity style={styles.card} onPress={() => openSummary(item)} activeOpacity={0.7}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(item.fullName ?? item.email ?? '?')[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.fullName ?? 'Paciente'}</Text>
                <Text style={styles.email}>{item.email}</Text>
              </View>
              <View style={[styles.riskBadge, { backgroundColor: rc + '20' }]}>
                <Text style={[styles.riskLabel, { color: rc }]}>{riskLabel(riskScore)}</Text>
                <Text style={[styles.riskScore, { color: rc }]}>{riskScore}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    margin: Spacing.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, ...Typography.body, color: Colors.textPrimary, paddingVertical: 0 },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.sm },
  emptyText: { ...Typography.body, color: Colors.textMuted },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  avatar: {
    width: 48, height: 48, borderRadius: Radius.full,
    backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...Typography.h3, color: Colors.primary },
  info: { flex: 1 },
  name: { ...Typography.body, fontWeight: '600', color: Colors.textPrimary },
  email: { ...Typography.caption, color: Colors.textSecondary },
  riskBadge: { alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.md },
  riskLabel: { ...Typography.label, fontSize: 10 },
  riskScore: { ...Typography.label, fontSize: 14 },
});
