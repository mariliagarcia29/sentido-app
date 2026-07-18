export type Role = 'patient' | 'doctor' | 'clinic';

// ─── IA — Alertas clínicos e auditoria (6) ──────────────────────────────────

export type AiAlertType = 'drug_interaction' | 'side_effect' | 'guideline' | 'attention';
export type AiAlertSeverity = 'info' | 'low' | 'medium' | 'high';
export type AiAlertStatus = 'pending' | 'accepted' | 'ignored';

export interface AiAlert {
  id: string;
  doctorId: string;
  patientId: string;
  patientCodeAi: string | null;
  type: AiAlertType;
  severity: AiAlertSeverity;
  title: string;
  description: string;
  recommendation: string;
  source: string | null;
  authors: string | null;
  journal: string | null;
  evidenceYear: number | null;
  involvedMedications: string[] | null;
  status: AiAlertStatus;
  decisionNote: string | null;
  decidedAt: string | null;
  auditLogId: string | null;
  createdAt: string;
}

export type AiAuditType = 'mind' | 'risk' | 'doc';
export type AiDecision = 'pending' | 'accepted' | 'revised' | 'ignored';

export interface AiAuditLog {
  id: string;
  type: AiAuditType;
  model: string;
  doctorId: string;
  patientCodeAi: string | null;
  inputSummary: string | null;
  outputSummary: string | null;
  alertsGenerated: number;
  decision: AiDecision;
  decisionNote: string | null;
  decidedAt: string | null;
  createdAt: string;
}

// ─── Matriz de acesso (5.4) ──────────────────────────────────────────────────

export interface AccessMatrixCell {
  roleKey: string;
  roleLabel: string;
  permission: string;
  permissionLabel: string;
  granted: boolean;
  isDefault: boolean;
  isOverridden: boolean;
}

export interface AccessMatrix {
  roles: Array<{ key: string; label: string }>;
  permissions: Array<{ key: string; label: string }>;
  cells: AccessMatrixCell[];
}

export interface MyPermissions {
  role: string;
  specialtyType: string | null;
  roleKey: string;
  permissions: string[];
}

export interface PatientCode {
  id: string;
  patientId: string;
  prefix: string;
  yearCode: string;
  sequentialNumber: number;
  randomSuffix: string;
  fullCode: string;  // e.g., 'PRX26-0042-X7'
  createdAt: string;
}

export interface InvitationCode {
  id: string;
  code: string;         // 4 chars, e.g., '7X29'
  prefix: string;       // 3 chars, e.g., 'PRX'
  displayCode: string;  // formatted, e.g., 'PRX · 7X29'
  generatedByDoctorId: string;
  usedByPatientId: string | null;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
  statusLabel?: 'ativo' | 'usado' | 'expirado';
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  locale: string;
  lgpdConsentedAt?: string | null;
  lgpdConsentVersion?: string | null;
  aiPrinciplesConsentAt?: string | null;
  aiPrinciplesConsentVersion?: string | null;
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
  symptom: string;
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
  prescribedBy?: string;
  archivedAt?: string;
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
  periodFrom: string;
  periodTo: string;
  includes: string[];
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
  observationType?: string;
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
  medications: MedicationRecord[];
}

// ─── Pré-consulta (Mind A1 — seção 3.5) ────────────────────────────────────

export interface TrendStat {
  avg: number;
  delta: number | null;
  direction: 'up' | 'down' | 'stable';
  checkCount: number;
}

export interface ScaleSummaryItem {
  scaleType: string;
  name: string;
  totalScore: number;
  maxScore: number;
  interpretation: string;
  hasCriticalAnswer: boolean;
  respondedAt: string;
}

export interface ClinicalGap {
  key: string;
  type: 'EXA' | 'ESC' | 'CON' | 'MED';
  description: string;
  detail: string;
  action: string;
}

export interface PreConsultationData {
  period: number;
  checkInRate: number;
  trends: {
    mood: TrendStat | null;
    anxiety: TrendStat | null;
    sleep: TrendStat | null;
  };
  scales: ScaleSummaryItem[];
  gaps: ClinicalGap[];
  suggestedQuestions: string[];
  mainComplaint: string | null;
}

export interface CheckIn {
  id: string;
  userId: string;
  mood?: number;
  moodLabel?: string;
  anxiety?: number;
  sleepHours?: number;
  medicationTaken?: string;
  // Camada 3 — segurança
  medicationReaction?: string;
  suicidalIdeation?: string;
  // Camada 2 — processos comportamentais
  physicalActivityMinutes?: number;
  nutritionQuality?: number;
  socialQuality?: number;
  substancesUsed?: string[];
  checkinDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientProfile {
  id: string;
  userId: string;
  preferredName?: string;
  cpf?: string;
  phone?: string;
  contactChannels?: string[];
  contactRestrictions?: string[];
  mainComplaint?: string;
  consultationGoals?: string[];
  urgency?: string;
  currentDiagnoses?: string[];
  hospitalizations?: string;
  riskHistory?: string;
  currentMedications?: Array<{ name: string; dose: string; schedule: string }>;
  allergies?: Array<{ substance: string; severity: string }>;
  allowWhatsappReminders: boolean;
  allowEmailSummary: boolean;
  allowAnonymousResearch: boolean;
  allowNewsletters: boolean;
  allowExternalAi?: boolean;
  declarationAccepted: boolean;
  termsAcceptedAt?: string;
  linkedDoctorCode?: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Escalas científicas ─────────────────────────────────────────────────────

export interface AnswerOption {
  value: number;
  label: string;
}

export interface ScaleQuestion {
  id: number;
  text: string;
  options: AnswerOption[];
  isCritical?: boolean;
  note?: string;
}

export interface ScoreRange {
  min: number;
  max: number;
  label: string;
  color: string;
}

export interface ScaleDefinition {
  type: string;
  name: string;
  fullName: string;
  description: string;
  timeframe: string;
  maxScore: number;
  higherIsBetter: boolean;
  questionCount: number;
  questions: ScaleQuestion[];
  scoreRanges: ScoreRange[];
}

export interface ScaleResponse {
  id: string;
  userId: string;
  scaleType: string;
  answers: number[];
  totalScore: number;
  interpretation: string;
  hasCriticalAnswer: boolean;
  triggeredBy: string;
  respondedAt: string;
}

export interface PendingScale {
  scaleType: string;
  name: string;
  fullName: string;
  description: string;
  questionCount: number;
  trigger: 'scheduled' | 'clinical' | 'diagnosis';
  lastRespondedAt: string | null;
}

export interface PatientScaleConfig {
  id: string;
  patientId: string;
  doctorId?: string;
  scaleType: string;
  isActive: boolean;
  frequencyDays?: number;
  triggerType: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsentRecord {
  id: string;
  patientId: string;
  doctorId: string;
  status: 'pending' | 'active' | 'revoked';
  accessLevel: string;
  createdAt: string;
}

// ─── Plano de cuidado (seção 3.6) ────────────────────────────────────────────

export interface CarePlanMedication {
  name: string;
  dose?: string;
  schedule?: string;
  action: 'manter' | 'alterar' | 'suspender';
}

export interface CarePlanHabit {
  description: string;
  frequency: string;
  category?: 'sono' | 'atividade' | 'alimentacao' | 'social' | 'mental' | 'substancias';
}

export interface CarePlanExam {
  name: string;
  deadlineDays?: number;
}

export interface CarePlanReferral {
  specialty: string;
  professional?: string;
  reason?: string;
}

export interface CarePlan {
  id: string;
  doctorId: string;
  patientId: string;
  medications?: CarePlanMedication[];
  psychotherapy?: {
    professional?: string;
    modality?: string;
    frequency?: string;
    status?: 'ativo' | 'pausado' | 'encerrado';
  };
  habits?: CarePlanHabit[];
  exams?: CarePlanExam[];
  referrals?: CarePlanReferral[];
  returnDate?: string;
  returnDuration?: number;
  returnModality?: string;
  clinicalAgreements?: Array<{ description: string }>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CarePlanTemplate {
  id: string;
  doctorId: string;
  name: string;
  description?: string;
  usageCount: number;
  medications?: CarePlanMedication[];
  psychotherapy?: CarePlan['psychotherapy'];
  habits?: CarePlanHabit[];
  exams?: CarePlanExam[];
  referrals?: CarePlanReferral[];
  returnModality?: string;
  clinicalAgreements?: Array<{ description: string }>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Integração externa (seção 4) ────────────────────────────────────────────

export type AppointmentSource = 'native' | 'nimsaude' | 'manual';

export interface ClinicIntegration {
  id: string;
  doctorId: string;
  provider: 'nimsaude' | 'manual';
  apiEndpoint: string | null;
  apiKey: string | null;
  clinicPrefix: string | null;
  isActive: boolean;
  lastSyncAt: string | null;
  lastSyncCount: number | null;
  lastSyncError: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Documentos médicos / extração (seção 3.8) ───────────────────────────────

export type DocumentStatus = 'revisao' | 'confirmado' | 'arquivado';
export type DocumentType = 'exame_laboratorial' | 'receita' | 'laudo' | 'outros';
export type ExamResultStatus = 'normal' | 'atencao' | 'critico';

export interface ExtractedExam {
  examType: string;
  name: string;
  value: number;
  unit: string;
  referenceMin: number | null;
  referenceMax: number | null;
  status: ExamResultStatus;
  confidence: number;
}

export interface FieldConfidences {
  patientName: number;
  collectionDate: number;
  laboratory: number;
  requestingDoctor: number;
}

export interface MedicalDocument {
  id: string;
  userId: string;
  documentType: DocumentType;
  status: DocumentStatus;
  confidenceScore: number;
  patientName: string | null;
  collectionDate: string | null;
  laboratory: string | null;
  requestingDoctor: string | null;
  extractedExams: ExtractedExam[];
  fieldConfidences: FieldConfidences;
  originalFilename: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExamTimelineEntry {
  id: string;
  value: number;
  status: ExamResultStatus;
  collectedAt: string;
  createdAt: string;
}

export interface ExamTimeline {
  examType: string;
  examName: string;
  unit: string;
  referenceMin: number | null;
  referenceMax: number | null;
  entries: ExamTimelineEntry[];
  latestStatus: ExamResultStatus;
  latestValue: number;
}

// ─── Síntese pré-consulta (6.2) ──────────────────────────────────────────────

export type LacunaType = 'EXA' | 'ESC' | 'CON' | 'MED';
export type LacunaAction = 'addressed' | 'ignored' | null;

export interface Lacuna {
  type: LacunaType;
  description: string;
  recommendation: string;
  action: LacunaAction;
  actionNote: string | null;
  actionAt: string | null;
}

export interface PreConsultationScaleSummary {
  scaleType: string;
  totalScore: number;
  interpretation: string;
  respondedAt: string;
  hasCriticalAnswer: boolean;
}

export interface PreConsultationSummary {
  id: string;
  doctorId: string;
  patientId: string;
  patientCodeAi: string | null;
  periodDays: number;
  checkinCount: number;
  moodAvg: number | null;
  moodDelta: number | null;
  anxietyAvg: number | null;
  anxietyDelta: number | null;
  sleepAvg: number | null;
  sleepDelta: number | null;
  medicationAdherence: number | null;
  scalesSummary: PreConsultationScaleSummary[];
  detectedLacunas: Lacuna[];
  suggestedQuestions: string[];
  summaryText: string | null;
  auditLogId: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  generatedAt: string;
}

// ─── Dashboard médico (seção 3.7) ────────────────────────────────────────────

export interface DashboardPatient {
  patientId: string;
  fullName: string;
  email: string;
  score: number;
  tags: string[];
  reasons: string[];
  avgMood: number | null;
  checkedInToday: boolean;
}

export interface DoctorDashboardData {
  totalPatients: number;
  attentionCount: number;
  criticalCount: number;
  attentionPatients: DashboardPatient[];
  allPatients: DashboardPatient[];
}

// ─── Conformidade de IA (seção 6.4) ──────────────────────────────────────────

export type AiProviderKey = 'anthropic' | 'openevidence' | 'local';
export type AiComplianceStatus = 'active' | 'pending_signature' | 'pending_review' | 'expired' | 'not_applicable';

export interface AiComplianceRecord {
  id: string;
  provider: AiProviderKey;
  status: AiComplianceStatus;
  noRetentionClause: boolean;
  noTrainingClause: boolean;
  lgpdCompatible: boolean;
  termsVersion: string | null;
  termsUrl: string | null;
  expiresAt: string | null;
  reviewedBy: string | null;
  notes: string | null;
  createdAt: string;
}

export interface AiComplianceProviderStatus {
  provider: AiProviderKey;
  displayName: string;
  description: string;
  noRetentionClause: boolean;
  noTrainingClause: boolean;
  lgpdCompatible: boolean;
  status: AiComplianceStatus;
  termsUrl: string | null;
  termsVersion: string | null;
  lastReviewedAt: string | null;
  expiresAt: string | null;
  notes: string;
  pendingActions: string[];
}

// ── Clinical Notes (8.5) ─────────────────────────────────────────────────────

export type NoteStatus = 'draft' | 'finalized';
export type SignatureMethod = 'gov_br_prata' | 'icp_brasil_a3' | 'cloud_cert';
export type MseCategory = 'afeto' | 'discurso' | 'comportamento' | 'cognicao' | 'risco';

export interface MseTag {
  category: MseCategory;
  value: string;
}

export interface ClinicalNoteSignature {
  method: SignatureMethod;
  signedAt: string;
  crmNumber: string;
  crmState: string;
  documentHash: string;
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId: string | null;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  coverageScore: number;
  mseTags: MseTag[] | null;
  mseSummary: string | null;
  patientFeedback: string | null;
  feedbackReleased: boolean;
  status: NoteStatus;
  signature: ClinicalNoteSignature | null;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Secure Messaging (8.5) ───────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  sender?: { id: string; fullName: string; role: string };
  content: string;
  type: 'text' | 'system';
  createdAt: string;
}

export interface DoctorInboxItem {
  patientId: string;
  patient?: { id: string; fullName: string; role: string };
  lastMessage: ChatMessage | null;
  unread: number;
}

export interface PatientRoom {
  doctorId: string;
  doctor?: { id: string; fullName: string; role: string };
  roomId: string;
  lastMessage: ChatMessage | null;
}

export type QuickReplies = Record<string, Array<{ id: string; label: string; template: string }>>;

// ── Patient Pre-Consultation Form (8.5.2 A1 — tela 67) ───────────────────────

export type PreFormType = 'first_visit' | 'follow_up';

export interface PatientPreForm {
  id: string;
  patientId: string;
  appointmentId: string | null;
  formType: PreFormType;
  chiefComplaint: string | null;
  objectives: string[] | null;
  currentSymptoms: string | null;
  hasUrgentConcern: boolean;
  urgentText: string | null;
  changesNotes: string | null;
  submittedAt: string;
  updatedAt: string;
}

// ── Clinical Timeline (8.5.2) ─────────────────────────────────────────────────

export type TimelineEventType = 'medication' | 'scale' | 'clinical_note' | 'checkin' | 'appointment';

export interface TimelineEvent {
  type: TimelineEventType;
  date: string;
  title: string;
  detail: string | null;
  severity?: string | null;
  score?: number | null;
  status?: string | null;
  id: string;
}

// ── Clinical Decision Support ─────────────────────────────────────────────────

export interface OeReference {
  pmid?: string;
  doi?: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  evidenceLevel?: string;
}

export interface OeAlert {
  category: 'drug_interaction' | 'side_effect' | 'guideline' | 'attention';
  severity: 'info' | 'low' | 'medium' | 'high';
  title: string;
  description: string;
  recommendation: string;
  references: OeReference[];
  confidence: number;
}

export interface DecisionSupportResult {
  alerts: OeAlert[];
  source: string;
}
