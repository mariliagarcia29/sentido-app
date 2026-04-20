import {
  Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_preferences')
export class UserPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Horário do lembrete diário de humor, ex: "08:00"
  @Column({ nullable: true })
  reminderTime: string;

  // { start: "22:00", end: "07:00" }
  @Column({ type: 'jsonb', nullable: true })
  quietHours: { start: string; end: string } | null;

  @Column({ default: true })
  appointmentReminders: boolean;

  @Column({ default: true })
  alertNotifications: boolean;

  @Column({ default: 'pt-BR' })
  language: string;
}
