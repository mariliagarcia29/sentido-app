import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum SignaturePreference {
  GOV_BR_PRATA = 'gov_br_prata',
  ICP_BRASIL_A3 = 'icp_brasil_a3',
  CLOUD_CERT = 'cloud_cert',
}

export enum CfmValidationStatus {
  PENDING = 'pending',     // não validado ainda
  VALID   = 'valid',       // validado com sucesso
  INVALID = 'invalid',     // CRM inválido ou cancelado
  EXPIRED = 'expired',     // validade do certificado expirada
}

@Entity('doctor_profiles')
export class DoctorProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { unique: true })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Registro profissional estruturado
  @Column()
  crmNumber: string;          // apenas o número, sem estado

  @Column({ length: 2 })
  crmState: string;           // UF do CRM (ex: SP, RJ)

  @Column({ type: 'varchar', nullable: true })
  crmSpecialty: string | null; // especialidade registrada no CFM (ex: 'Psiquiatria')

  @Column({ type: 'varchar', nullable: true })
  crmSecondary: string | null; // segundo conselho (ex: CRP, CRN para equipe)

  // Validação CFM
  @Column({ type: 'enum', enum: CfmValidationStatus, default: CfmValidationStatus.PENDING })
  cfmStatus: CfmValidationStatus;

  @Column({ type: 'timestamptz', nullable: true })
  cfmValidatedAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  cfmValidatorName: string | null;  // nome do profissional conforme CFM

  @Column({ type: 'varchar', nullable: true })
  cfmValidatorCrm: string | null;   // CRM retornado pela API CFM

  // Assinatura digital
  @Column({ type: 'enum', enum: SignaturePreference, default: SignaturePreference.GOV_BR_PRATA })
  preferredSignatureMethod: SignaturePreference;

  // gov.br OAuth — armazena somente o CPF hash (nunca o token)
  @Column({ default: false })
  govBrLinked: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  govBrLinkedAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  govBrLevel: string | null;   // 'prata' | 'ouro'

  // Perfil clínico
  @Column({ type: 'varchar', nullable: true })
  bio: string | null;

  @Column({ type: 'varchar', nullable: true })
  institution: string | null;

  @Column({ type: 'varchar', nullable: true })
  institutionCnpj: string | null;

  @Column('simple-array', { nullable: true })
  subspecialties: string[] | null;

  @Column({ type: 'varchar', nullable: true })
  attendanceModel: string | null; // 'presencial' | 'online' | 'híbrido'

  // Personalização do vocabulário
  @Column({ type: 'jsonb', nullable: true })
  customMseTags: Record<string, string[]> | null;   // categoria → tags adicionais

  @Column({ type: 'jsonb', nullable: true })
  favoriteDiagnoses: string[] | null;   // CID-10 usados com frequência

  @Column({ type: 'jsonb', nullable: true })
  favoriteMedications: string[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
