import * as SecureStore from 'expo-secure-store';
import i18n from '../i18n';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

async function getHeaders(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync('auth_token');
  return {
    'Content-Type': 'application/json',
    'Accept-Language': i18n.language ?? 'pt-BR',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers = await getHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message ?? 'Request failed');
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ access_token: string; user: any }>('/auth/login', { email, password }),
  register: (data: { email: string; password: string; fullName: string; dateOfBirth: string }) =>
    api.post<{ access_token: string; user: any }>('/auth/register', data),
  me: () => api.get<any>('/auth/me'),
};

// Records
export const recordsApi = {
  getMoods: () => api.get<any[]>('/records/moods'),
  createMood: (data: { score: number; label: string; isPrivate: boolean }) =>
    api.post('/records/moods', data),
  getSymptoms: () => api.get<any[]>('/records/symptoms'),
  createSymptom: (data: { symptom: string; severity: string; isPrivate: boolean }) =>
    api.post('/records/symptoms', data),
  getMedications: () => api.get<any[]>('/records/medications'),
  createMedication: (data: { name: string; dose: string; taken: boolean }) =>
    api.post('/records/medications', data),
};

// Appointments
export const appointmentsApi = {
  getAll: () => api.get<any[]>('/appointments'),
  getMine: () => api.get<any[]>('/appointments'),   // alias usado no Dashboard
  cancel: (id: string) => api.patch(`/appointments/${id}/cancel`),
};

// Exports
export const exportsApi = {
  request: (data: { periodFrom: string; periodTo: string; includes: string[] }) =>
    api.post<{ id: string }>('/export', data),
  getAll: () => api.get<any[]>('/export'),
  download: (id: string) => api.get<{ fileUrl: string }>(`/export/${id}`),
};

// Observations (patient)
export const observationsApi = {
  mine: () => api.get<any[]>('/observations/mine'),
  unreadCount: () => api.get<{ count: number }>('/observations/unread-count'),
  markRead: (id: string) => api.patch(`/observations/${id}/read`),
};

// Wearables
export const wearablesApi = {
  getConnections: () => api.get<any[]>('/wearables/connections'),
  getSummary: () => api.get<any[]>('/wearables/summary'),
  pushData: (data: { source: string; dataType: string; value: number; recordedAt: string }) =>
    api.post('/wearables/data', data),
};

// Telemedicine
export const telemedicineApi = {
  getOrCreateRoom: (appointmentId: string) =>
    api.post<{ roomId: string; meetingUrl: string }>(`/telemedicine/appointments/${appointmentId}/room`, {}),
  getToken: (appointmentId: string) =>
    api.get<{ token: string | null }>(`/telemedicine/appointments/${appointmentId}/token`),
  getChatHistory: (roomId: string) =>
    api.get<any[]>(`/chat/${roomId}/history`),
};

// Preferences
export const preferencesApi = {
  get: () => api.get<any>('/preferences'),
  update: (data: any) => api.patch('/preferences', data),
};

// Doctor
export const doctorApi = {
  listPatients: () => api.get<any[]>('/doctor/patients'),
  getPatientSummary: (patientId: string) =>
    api.get<any>(`/doctor/patients/${patientId}/summary`),
  createObservation: (patientId: string, data: { content: string; severity: string }) =>
    api.post(`/observations/${patientId}`, data),
  listObservations: (patientId: string) =>
    api.get<any[]>(`/observations/${patientId}`),
};

// Consent
export const consentApi = {
  list: () => api.get<any[]>('/consent'),
  invite: (patientEmail: string) =>
    api.post('/consent/invite', { patientEmail, accessLevel: 'full' }),
  act: (id: string, action: 'approve' | 'revoke') =>
    api.patch(`/consent/${id}`, { action }),
};

// Notifications token
export const notificationsApi = {
  registerToken: (platform: 'ios' | 'android' | 'web', token: string) =>
    api.post('/notifications/token', { platform, token }),
  deactivateToken: (_token: string) =>
    api.delete(`/notifications/token`),
};
