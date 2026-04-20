import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
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

  // Campos exclusivos de médicos
  @Column({ nullable: true })
  specialty!: string;

  @Column({ nullable: true })
  crmLink!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
