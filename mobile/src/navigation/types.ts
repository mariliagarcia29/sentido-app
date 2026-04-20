export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type PatientTabParamList = {
  Dashboard: undefined;
  Records: undefined;
  Appointments: undefined;
  Observations: undefined;
  Wearables: undefined;
  Export: undefined;
  Settings: undefined;
};

export type DoctorTabParamList = {
  Patients: undefined;
  DoctorAppointments: undefined;
  Consents: undefined;
  DoctorSettings: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  PatientTabs: undefined;
  DoctorTabs: undefined;
  PatientSummary: { patientId: string; patientName: string };
  Teleconsulta: { appointmentId: string; meetingUrl: string };
};
