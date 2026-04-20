import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

import { Colors, Spacing, Typography, Radius } from '../../theme';
import { Button } from '../../components/Button';

const { width } = Dimensions.get('window');

type Slide = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
  title: string;
  subtitle: string;
  desc: string;
};

type Props = { onDone: () => void };

export function OnboardingScreen({ onDone }: Props) {
  const { t } = useTranslation();
  const flatRef = useRef<FlatList>(null);
  const [current, setCurrent] = useState(0);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const slides: Slide[] = [
    {
      key: '1',
      icon: 'heart-circle',
      iconColor: Colors.primary,
      bgColor: '#EBF4FF',
      title: t('onboarding.step1Title'),
      subtitle: t('onboarding.step1Subtitle'),
      desc: t('onboarding.step1Desc'),
    },
    {
      key: '2',
      icon: 'shield-checkmark',
      iconColor: Colors.secondary,
      bgColor: '#E8F8EF',
      title: t('onboarding.step2Title'),
      subtitle: t('onboarding.step2Subtitle'),
      desc: t('onboarding.step2Desc'),
    },
    {
      key: '3',
      icon: 'document-text',
      iconColor: Colors.warning,
      bgColor: '#FEF9EC',
      title: t('onboarding.step3Title'),
      subtitle: t('onboarding.step3Subtitle'),
      desc: '',
    },
  ];

  const isLast = current === slides.length - 1;

  const goNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      flatRef.current?.scrollToIndex({ index: current + 1 });
      setCurrent((c) => c + 1);
    }
  };

  const handleFinish = async () => {
    if (!consentAccepted) {
      Alert.alert('Consentimento obrigatório', 'Você precisa aceitar os termos para continuar.');
      return;
    }
    await SecureStore.setItemAsync('onboarding_done', 'true');
    onDone();
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={styles.slide}>
      <View style={[styles.iconCircle, { backgroundColor: item.bgColor }]}>
        <Ionicons name={item.icon} size={72} color={item.iconColor} />
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
      {item.key !== '3' && <Text style={styles.slideDesc}>{item.desc}</Text>}

      {item.key === '3' && (
        <View style={styles.consentBox}>
          <Text style={styles.consentTitle}>{t('onboarding.consentTitle')}</Text>
          <Text style={styles.consentBody}>{t('onboarding.consentBody')}</Text>
          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setConsentAccepted((v) => !v)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, consentAccepted && styles.checkboxChecked]}>
              {consentAccepted && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.checkLabel}>{t('onboarding.accept')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(i) => i.key}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
          ))}
        </View>

        <Button
          label={isLast ? t('onboarding.getStarted') : t('common.next')}
          onPress={goNext}
          disabled={isLast && !consentAccepted}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  slide: {
    width,
    flex: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 140, height: 140, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl,
  },
  slideTitle: { ...Typography.h1, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  slideSubtitle: { ...Typography.h3, color: Colors.primary, textAlign: 'center', marginBottom: Spacing.md },
  slideDesc: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  consentBox: {
    width: '100%', backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginTop: Spacing.md,
  },
  consentTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.sm },
  consentBody: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.md },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  checkbox: {
    width: 22, height: 22, borderRadius: Radius.sm - 4,
    borderWidth: 2, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.primary },
  checkLabel: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  footer: { padding: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.md },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  dot: { width: 8, height: 8, borderRadius: Radius.full, backgroundColor: Colors.border },
  dotActive: { width: 24, backgroundColor: Colors.primary },
});
