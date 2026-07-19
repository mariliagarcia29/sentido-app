import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NoteStatus {
  DRAFT = 'draft',
  FINALIZED = 'finalized',
}

export enum SignatureMethod {
  GOV_BR_PRATA = 'gov_br_prata',
  ICP_BRASIL_A3 = 'icp_brasil_a3',
  CLOUD_CERT = 'cloud_cert',
}

// Exame do Estado Mental — vocabulário clínico estruturado
export interface MseTag {
  category: 'afeto' | 'discurso' | 'comportamento' | 'cognicao';
  value: string;
}

export interface Signature {
  method: SignatureMethod;
  signedAt: string;
  crmNumber: string;
  crmState: string;
  documentHash: string;
  validatorId?: string; // gov.br CPF hash
}

@Entity('clinical_notes')
export class ClinicalNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'patientId' })
  patient: User;

  @Column()
  doctorId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'doctorId' })
  doctor: User;

  // SOAP fields
  @Column({ type: 'text', default: '' })
  subjective: string;

  @Column({ type: 'text', default: '' })
  objective: string;

  @Column({ type: 'text', default: '' })
  assessment: string;

  @Column({ type: 'text', default: '' })
  plan: string;

  // Clinical coverage score (0–100)
  @Column({ type: 'int', default: 0 })
  coverageScore: number;

  // MSE — Mental Status Exam tags
  @Column({ type: 'jsonb', nullable: true })
  mseTags: MseTag[] | null;

  // Auto-generated MSE summary from tags
  @Column({ type: 'text', nullable: true })
  mseSummary: string | null;

  // Patient-facing devolutiva (LLM-generated, reviewed by doctor)
  @Column({ type: 'text', nullable: true })
  patientFeedback: string | null;

  @Column({ default: false })
  feedbackReleased: boolean;

  // Signature for legal validity (prontuário)
  @Column({ type: 'enum', enum: NoteStatus, default: NoteStatus.DRAFT })
  status: NoteStatus;

  @Column({ type: 'jsonb', nullable: true })
  signature: Signature | null;

  @Column({ type: 'timestamp', nullable: true })
  finalizedAt: Date | null;

  // Optional link to appointment
  @Column({ type: 'varchar', nullable: true })
  appointmentId: string | null;

  // Audit
  @Column({ nullable: true })
  lastSavedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
