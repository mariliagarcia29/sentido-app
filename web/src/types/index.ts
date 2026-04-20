export type Role = 'patient' | 'doctor';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  locale: string;
}

export interface MoodEntry {
  id: string;
  score: number;
  note?: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface SymptomRecord {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high';
  note?: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface MedicationRecord {
  id: string;
  name: string;
  dose: string;
  taken: boolean;
  scheduledAt: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  doctor?: { id: string; fullName: string; email: string };
  scheduledAt: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  meetingUrl?: string;
}

export interface PdfExport {
  id: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  fileUrl?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface ClinicalObservation {
  id: string;
  patientId: string;
  content: string;
  severity: 'info' | 'warn' | 'critical';
  triggeredBy: 'system' | 'doctor';
  isRead: boolean;
  createdAt: string;
}

export interface PatientSummary {
  patient: { id: string; fullName: string; email: string; dateOfBirth?: string };
  avgMood: number;
  missedMeds: number;
  criticalSymptoms: number;
  riskScore: number;
  observations: ClinicalObservation[];
}

export interface ConsentRecord {
  id: string;
  patientId: string;
  doctorId: string;
  status: 'pending' | 'active' | 'revoked';
  accessLevel: string;
  createdAt: string;
}
