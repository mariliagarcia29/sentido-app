import 'expo-localization';
import './src/i18n';

import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Colors } from './src/theme';
import { RootStackParamList } from './src/navigation/types';

// Exibe notificações enquanto o app está em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    // Tap em notificação — navega para a tela relevante
    const sub = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as Record<string, any>;

      if (!navRef.current) return;

      if (data?.type === 'export_ready') {
        // Abre a aba de exportação para paciente
        navRef.current.navigate('PatientTabs' as any);
      } else if (data?.type === 'observation_created') {
        navRef.current.navigate('PatientTabs' as any);
      } else if (data?.type === 'teleconsulta' && data.appointmentId && data.meetingUrl) {
        navRef.current.navigate('Teleconsulta', {
          appointmentId: data.appointmentId,
          meetingUrl: data.meetingUrl,
        });
      }
    });

    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer ref={navRef}>
          <StatusBar style="dark" backgroundColor={Colors.background} />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
