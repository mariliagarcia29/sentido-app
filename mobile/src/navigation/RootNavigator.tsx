import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';

import { RootStackParamList } from './types';
import { useAuth } from '../context/AuthContext';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { AuthStack } from './AuthStack';
import { PatientTabs } from './PatientTabs';
import { DoctorStack } from './DoctorStack';
import { TeleconsultaScreen } from '../screens/patient/TeleconsultaScreen';
import { PatientSummaryScreen } from '../screens/doctor/PatientSummaryScreen';
import { Colors, Typography } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, isLoading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync('onboarding_done').then((val) => {
      setOnboardingDone(val === 'true');
    });
  }, []);

  if (isLoading || onboardingDone === null) return null;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTitleStyle: { ...Typography.h3, color: Colors.textPrimary },
        headerShadowVisible: false,
        headerBackTitle: 'Voltar',
        headerTintColor: Colors.primary,
      }}
    >
      {!onboardingDone ? (
        <Stack.Screen name="Onboarding" options={{ headerShown: false }}>
          {() => <OnboardingScreen onDone={() => setOnboardingDone(true)} />}
        </Stack.Screen>
      ) : !user ? (
        <Stack.Screen name="Auth" component={AuthStack} options={{ headerShown: false }} />
      ) : user.role === 'doctor' ? (
        <>
          <Stack.Screen name="DoctorTabs" component={DoctorStack} options={{ headerShown: false }} />
          <Stack.Screen
            name="PatientSummary"
            component={PatientSummaryScreen}
            options={({ route }) => ({ title: route.params.patientName })}
          />
          <Stack.Screen
            name="Teleconsulta"
            component={TeleconsultaScreen}
            options={{ title: 'Teleconsulta' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="PatientTabs" component={PatientTabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="Teleconsulta"
            component={TeleconsultaScreen}
            options={{ title: 'Teleconsulta' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
