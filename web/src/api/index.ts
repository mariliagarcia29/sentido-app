import api from './client';
import type {
  Appointment, ClinicalObservation, ConsentRecord,
  MedicationRecord, MoodEntry, PdfExport, SymptomRecord, PatientSummary, User,
} from '../types';


export interface UserPreferences {
  reminderTime?: string;
  quietHours?: { start: string; end: string };
  appointmentReminders: boolean;
  alertNotifications: boolean;
  language?: string;
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ access_token: string; user: User }>('/auth/login', { email, password }),
  register: (body: { fullName: string; email: string; password: string; dateOfBirth?: string; role?: string; specialty?: string; crmLink?: string }) =>
    api.post<{ access_token: string; user: User }>('/auth/register', body),
  oauthLogin: (provider: 'google' | 'apple', idToken: string) =>
    api.post<{ access_token: string; user: User }>('/auth/oauth', { provider, idToken }),
  me: () => api.get<User>('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Records
export const recordsApi = {
  listMoods: () => api.get<MoodEntry[]>('/records/moods'),
  createMood: (score: number, label?: string, isPrivate = false) =>
    api.post<MoodEntry>('/records/moods', { score, label, isPrivate }),
  deleteMood: (id: string) => api.delete(`/records/moods/${id}`),
  listSymptoms: () => api.get<SymptomRecord[]>('/records/symptoms'),
  createSymptom: (data: { symptom: string; severity: string; isPrivate?: boolean }) =>
    api.post<SymptomRecord>('/records/symptoms', data),
  deleteSymptom: (id: string) => api.delete(`/records/symptoms/${id}`),
  listMedications: () => api.get<MedicationRecord[]>('/records/medications'),
  createMedication: (data: { name: string; dose?: string; taken: boolean }) =>
    api.post<MedicationRecord>('/records/medications', data),
  markMedicationTaken: (id: string) => api.patch<MedicationRecord>(`/records/medications/${id}/taken`),
  deleteMedication: (id: string) => api.delete(`/records/medications/${id}`),
};

// Appointments
export const appointmentsApi = {
  list: () => api.get<Appointment[]>('/appointments'),
  create: (doctorId: string, scheduledAt: string) =>
    api.post<Appointment>('/appointments', { doctorId, scheduledAt }),
  cancel: (id: string) => api.patch<Appointment>(`/appointments/${id}/cancel`),
};

// Export PDF — usa periodFrom/periodTo conforme DTO do backend
export const exportsApi = {
  list: () => api.get<PdfExport[]>('/export'),
  generate: (body: { from: string; to: string; includes: string[] }) =>
    api.post<PdfExport>('/export', { periodFrom: body.from, periodTo: body.to, includes: body.includes }),
  getDownload: (id: string) => api.get<{ fileUrl: string }>(`/export/${id}`),
};

// Doctor
export const doctorApi = {
  listPatients: () => api.get<User[]>('/doctor/patients'),
  getPatientSummary: (patientId: string) =>
    api.get<PatientSummary>(`/doctor/patients/${patientId}/summary`),
  listPatientMedications: (patientId: string) =>
    api.get<MedicationRecord[]>(`/doctor/patients/${patientId}/medications`),
  listPatientSymptoms: (patientId: string) =>
    api.get<SymptomRecord[]>(`/doctor/patients/${patientId}/symptoms`),
  prescribeMedication: (patientId: string, data: { name: string; dose?: string }) =>
    api.post<MedicationRecord>(`/doctor/patients/${patientId}/medications`, data),
  archiveMedication: (patientId: string, medicationId: string) =>
    api.patch<MedicationRecord>(`/doctor/patients/${patientId}/medications/${medicationId}/archive`),
  createObservation: (patientId: string, data: { content: string; severity: string; observationType?: string }) =>
    api.post<ClinicalObservation>(`/observations/${patientId}`, data),
  listObservations: (patientId: string) =>
    api.get<ClinicalObservation[]>(`/observations/${patientId}`),
  invitePatient: (patientEmail: string) =>
    consentApi.invite(patientEmail),
};

// Consent
export const consentApi = {
  list: () => api.get<ConsentRecord[]>('/consent'),
  // Patient: lista solicitações pendentes de médicos
  listPending: () => api.get<ConsentRecord[]>('/consent/pending'),
  // Patient: solicita vínculo com médico
  request: (doctorEmail: string) => api.post('/consent/request', { doctorEmail }),
  // Doctor: convida paciente
  invite: (patientEmail: string, accessLevel = 'full') =>
    api.post('/consent/invite', { patientEmail, accessLevel }),
  // Patient: responde solicitação (approve/revoke)
  respond: (id: string, action: 'approve' | 'revoke') =>
    api.patch(`/consent/${id}/respond`, { action }),
  // Doctor/Patient: age sobre consentimento
  act: (id: string, action: 'approve' | 'revoke') =>
    api.patch(`/consent/${id}`, { action }),
  myDoctors: () => api.get<ConsentRecord[]>('/consent/my-doctors'),
};

// Preferences
export const preferencesApi = {
  get: () => api.get<UserPreferences>('/preferences'),
  update: (data: Partial<UserPreferences>) => api.patch<UserPreferences>('/preferences', data),
};

// Notifications
export const notificationsApi = {
  registerToken: (platform: 'ios' | 'android' | 'web', token: string) =>
    api.post('/notifications/token', { platform, token }),
  deactivateToken: (token: string) =>
    api.delete('/notifications/token', { data: { token } }),
};

// Wearables
export interface WearableSummaryItem {
  dataType: string;
  latest: number;
  avg: number;
  lastRecordedAt: string;
}

export interface WearableConnection {
  id: string;
  provider: string;
  isActive: boolean;
  lastSyncAt?: string;
}

export const wearablesApi = {
  getConnections: () => api.get<WearableConnection[]>('/wearables/connections'),
  disconnect: (provider: string) => api.delete(`/wearables/connections/${provider}`),
  syncFitbit: () => api.post<{ synced: number }>('/wearables/fitbit/sync'),
  getSummary: () => api.get<WearableSummaryItem[]>('/wearables/summary'),
  getData: (type?: string, days?: number) =>
    api.get('/wearables/data', { params: { type, days } }),
  getFitbitConnectUrl: () => `${api.defaults.baseURL}/wearables/fitbit/connect`,
};

// Telemedicina
export const telemedicineApi = {
  getOrCreateRoom: (appointmentId: string) =>
    api.post<{ roomId: string; meetingUrl: string }>(`/telemedicine/appointments/${appointmentId}/room`),
  getToken: (appointmentId: string) =>
    api.get<{ token: string | null }>(`/telemedicine/appointments/${appointmentId}/token`),
  getChatHistory: (roomId: string) =>
    api.get<any[]>(`/chat/${roomId}/history`),
};

// Observações do paciente (alertas do sistema + notas do médico)
export const observationsApi = {
  mine: () => api.get<ClinicalObservation[]>('/observations/mine'),
  unreadCount: () => api.get<{ count: number }>('/observations/unread-count'),
  markRead: (id: string) => api.patch(`/observations/${id}/read`),
};
