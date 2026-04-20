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

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.includes('@')) e.email = 'E-mail inválido';
    if (password.length < 8) e.password = 'Mínimo 8 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { access_token, user } = await authApi.login(email, password);
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
          <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
        </View>

        <View style={styles.form}>
          <Input
            label={t('auth.email')}
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <Input
            label={t('auth.password')}
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            isPassword
            error={errors.password}
          />

          <TouchableOpacity style={styles.forgotWrap}>
            <Text style={styles.forgot}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>

          <Button label={t('auth.login')} onPress={handleLogin} loading={loading} />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            label={t('auth.continueGoogle')}
            onPress={() => {}}
            variant="outline"
            style={styles.socialBtn}
          />
          <Button
            label={t('auth.continueApple')}
            onPress={() => {}}
            variant="outline"
            style={styles.socialBtn}
          />
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.switchWrap}>
          <Text style={styles.switchText}>{t('auth.noAccount')} </Text>
          <Text style={styles.switchLink}>{t('auth.register')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, padding: Spacing.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  logo: {
    width: 80, height: 80, borderRadius: Radius.full, backgroundColor: '#EBF4FF',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  appName: { ...Typography.h1, color: Colors.primary, marginBottom: Spacing.xs },
  title: { ...Typography.h3, color: Colors.textSecondary },
  form: { marginBottom: Spacing.lg },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: Spacing.md, marginTop: -Spacing.xs },
  forgot: { ...Typography.caption, color: Colors.primary },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { ...Typography.caption, color: Colors.textMuted, marginHorizontal: Spacing.sm },
  socialBtn: { marginBottom: Spacing.sm },
  switchWrap: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.md },
  switchText: { ...Typography.body, color: Colors.textSecondary },
  switchLink: { ...Typography.body, color: Colors.primary, fontWeight: '600' },
});
