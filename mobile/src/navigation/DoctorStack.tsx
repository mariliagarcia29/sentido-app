import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { DoctorTabParamList } from './types';
import { Colors, Typography } from '../theme';
import { PatientsScreen } from '../screens/doctor/PatientsScreen';
import { DoctorAppointmentsScreen } from '../screens/doctor/DoctorAppointmentsScreen';
import { ConsentScreen } from '../screens/doctor/ConsentScreen';
import { SettingsScreen } from '../screens/patient/SettingsScreen';

const Tab = createBottomTabNavigator<DoctorTabParamList>();

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function DoctorStack() {
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
        name="Patients"
        component={PatientsScreen}
        options={{
          title: 'Pacientes',
          tabBarIcon: ({ focused }) => tabIcon(focused, 'people', 'people-outline'),
        }}
      />
      <Tab.Screen
        name="DoctorAppointments"
        component={DoctorAppointmentsScreen}
        options={{
          title: 'Agenda',
          tabBarIcon: ({ focused }) => tabIcon(focused, 'calendar', 'calendar-outline'),
        }}
      />
      <Tab.Screen
        name="Consents"
        component={ConsentScreen}
        options={{
          title: 'Consentimentos',
          tabBarIcon: ({ focused }) => tabIcon(focused, 'shield-checkmark', 'shield-checkmark-outline'),
        }}
      />
      <Tab.Screen
        name="DoctorSettings"
        component={SettingsScreen}
        options={{
          title: 'Configurações',
          tabBarIcon: ({ focused }) => tabIcon(focused, 'settings', 'settings-outline'),
        }}
      />
    </Tab.Navigator>
  );
}
