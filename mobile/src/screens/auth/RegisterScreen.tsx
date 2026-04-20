import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { AuthStackParamList } from '../../navigation/types';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { login } = useAuth();

  const [form, setForm] = useState({ fullName: '', email: '', password: '', dateOfBirth: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const set = (key: keyof typeof form) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.fullName.trim()) e.fullName = 'Nome obrigatório';
    if (!form.email.includes('@')) e.email = 'E-mail inválido';
    if (form.password.length < 8) e.password = 'Mínimo 8 caracteres';
    if (!form.dateOfBirth) e.dateOfBirth = 'Data obrigatória';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { access_token, user } = await authApi.register(form);
      await login(access_token, user);
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logo}>
            <Ionicons name="heart-circle" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>Sentido</Text>
          <Text style={styles.title}>{t('auth.createAccount')}</Text>
        </View>

        <View style={styles.form}>
          <Input
            label={t('auth.fullName')}
            placeholder="Ana Silva"
            value={form.fullName}
            onChangeText={set('fullName')}
            error={errors.fullName}
          />
          <Input
            label={t('auth.email')}
            placeholder={t('auth.emailPlaceholder')}
            value={form.email}
            onChangeText={set('email')}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <Input
            label={t('auth.password')}
            placeholder={t('auth.passwordPlaceholder')}
            value={form.password}
            onChangeText={set('password')}
            isPassword
            error={errors.password}
          />
          <Input
            label={t('auth.dateOfBirth')}
            placeholder="DD/MM/AAAA"
            value={form.dateOfBirth}
            onChangeText={set('dateOfBirth')}
            keyboardType="numeric"
            error={errors.dateOfBirth}
          />

          <Button label={t('auth.register')} onPress={handleRegister} loading={loading} style={styles.btn} />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button label={t('auth.continueGoogle')} onPress={() => {}} variant="outline" style={styles.socialBtn} />
          <Button label={t('auth.continueApple')} onPress={() => {}} variant="outline" style={styles.socialBtn} />
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.switchWrap}>
          <Text style={styles.switchText}>{t('auth.hasAccount')} </Text>
          <Text style={styles.switchLink}>{t('auth.login')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, padding: Spacing.lg, paddingTop: Spacing.xxl },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  logo: {
    width: 72, height: 72, borderRadius: Radius.full, backgroundColor: '#EBF4FF',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  appName: { ...Typography.h2, color: Colors.primary, marginBottom: Spacing.xs },
  title: { ...Typography.h3, color: Colors.textSecondary },
  form: { marginBottom: Spacing.lg },
  btn: { marginTop: Spacing.sm },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { ...Typography.caption, color: Colors.textMuted, marginHorizontal: Spacing.sm },
  socialBtn: { marginBottom: Spacing.sm },
  switchWrap: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.md },
  switchText: { ...Typography.body, color: Colors.textSecondary },
  switchLink: { ...Typography.body, color: Colors.primary, fontWeight: '600' },
});
