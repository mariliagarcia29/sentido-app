import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ObservationSeverity {
  INFO = 'info',
  WARN = 'warn',
  CRITICAL = 'critical',
}

export enum ObservationTrigger {
  SYSTEM = 'system',
  DOCTOR = 'doctor',
}

@Entity('clinical_observations')
export class ClinicalObservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patientId' })
  patient: User;

  @Column({ nullable: true })
  doctorId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'doctorId' })
  doctor: User;

  @Column({ type: 'enum', enum: ObservationTrigger, default: ObservationTrigger.DOCTOR })
  triggeredBy: ObservationTrigger;

  @Column({ type: 'enum', enum: ObservationSeverity, default: ObservationSeverity.INFO })
  severity: ObservationSeverity;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  observationType: string; // 'note' | 'diagnosis'

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
