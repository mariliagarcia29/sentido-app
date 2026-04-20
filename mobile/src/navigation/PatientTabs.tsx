import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { PatientTabParamList } from './types';
import { Colors, Typography } from '../theme';
import { DashboardScreen } from '../screens/patient/DashboardScreen';
import { RecordsScreen } from '../screens/patient/RecordsScreen';
import { AppointmentsScreen } from '../screens/patient/AppointmentsScreen';
import { ObservationsScreen } from '../screens/patient/ObservationsScreen';
import { WearablesScreen } from '../screens/patient/WearablesScreen';
import { ExportScreen } from '../screens/patient/ExportScreen';
import { SettingsScreen } from '../screens/patient/SettingsScreen';

const Tab = createBottomTabNavigator<PatientTabParamList>();

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function PatientTabs() {
  const { t } = useTranslation();

  const tabIcon = (focused: boolean, active: IconName, inactive: IconName) => (
    <Ionicons name={focused ? active : inactive} size={24} color={focused ? Colors.primary : Colors.textMuted} />
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface, elevation: 0, shadowOpacity: 0 },
        headerTitleStyle: { ...Typography.h3, color: Colors.textPrimary },
        tabBarStyle: { borderTopColor: Colors.border, height: 64, paddingBottom: 8 },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { ...Typography.caption, marginTop: -2 },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Início',
          tabBarIcon: ({ focused }) => tabIcon(focused, 'home', 'home-outline'),
        }}
      />
      <Tab.Screen
        name="Records"
        component={RecordsScreen}
        options={{
          title: t('records.title'),
          tabBarIcon: ({ focused }) => tabIcon(focused, 'heart', 'heart-outline'),
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{
          title: t('appointments.title'),
          tabBarIcon: ({ focused }) => tabIcon(focused, 'calendar', 'calendar-outline'),
        }}
      />
      <Tab.Screen
        name="Observations"
        component={ObservationsScreen}
        options={{
          title: 'Alertas',
          tabBarIcon: ({ focused }) => tabIcon(focused, 'notifications', 'notifications-outline'),
        }}
      />
      <Tab.Screen
        name="Wearables"
        component={WearablesScreen}
        options={{
          title: 'Wearables',
          tabBarIcon: ({ focused }) => tabIcon(focused, 'watch', 'watch-outline'),
        }}
      />
      <Tab.Screen
        name="Export"
        component={ExportScreen}
        options={{
          title: t('export.title'),
          tabBarIcon: ({ focused }) => tabIcon(focused, 'document-text', 'document-text-outline'),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('settings.title'),
          tabBarIcon: ({ focused }) => tabIcon(focused, 'settings', 'settings-outline'),
        }}
      />
    </Tab.Navigator>
  );
}
