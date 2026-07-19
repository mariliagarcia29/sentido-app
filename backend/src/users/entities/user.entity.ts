import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  CLINIC = 'clinic',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Exclude()
  @Column({ nullable: true })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.PATIENT })
  role!: UserRole;

  @Column()
  fullName!: string;

  @Column({ default: 'pt-BR' })
  locale!: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth!: string;

  @Column({ nullable: true })
  emergencyContact!: string;

  @Column({ default: false })
  isAdmin!: boolean;

  // Campos de profissionais de saúde
  @Column({ type: 'varchar', nullable: true })
  specialtyType!: string | null; // medico | psicologo | educador_fisico | nutricionista | enfermeiro | outro

  @Column({ type: 'varchar', nullable: true })
  specialty!: string | null;

  @Column({ type: 'varchar', nullable: true })
  crmLink!: string | null; // número de registro profissional (CRM, CRP, CREF, CRN, COREN, etc.)

  @Column({ type: 'varchar', nullable: true })
  institution!: string | null; // instituição associada (para profissionais)

  // Campos exclusivos de clínicas
  @Column({ type: 'varchar', nullable: true })
  cnpj!: string | null;

  @Column({ type: 'varchar', nullable: true })
  responsibleName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  responsibleRegistration!: string | null;

  // LGPD — consentimento geral de uso da plataforma
  @Column({ type: 'timestamptz', nullable: true })
  lgpdConsentedAt!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  lgpdConsentVersion!: string | null;

  // IA — aceite formal dos princípios de uso (6.1)
  @Column({ type: 'timestamptz', nullable: true })
  aiPrinciplesConsentAt!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  aiPrinciplesConsentVersion!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
