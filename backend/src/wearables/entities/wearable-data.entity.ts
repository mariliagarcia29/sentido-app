import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum WearableSource {
  FITBIT = 'fitbit',
  GARMIN = 'garmin',
  SAMSUNG = 'samsung',
  APPLE = 'apple',
  GOOGLE = 'google',
}

export enum WearableDataType {
  STEPS = 'steps',
  HEART_RATE = 'heart_rate',
  SLEEP = 'sleep',
  GLUCOSE = 'glucose',
  WEIGHT = 'weight',
  CALORIES = 'calories',
}

export enum WearableSyncStatus {
  PARTIAL = 'partial',
  COMPLETE = 'complete',
  ERROR = 'error',
}

@Entity('wearable_data')
export class WearableData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: WearableSource })
  source: WearableSource;

  @Column({ nullable: true })
  deviceName: string;

  @Column({ nullable: true })
  scope: string;

  @Column({ type: 'enum', enum: WearableDataType })
  dataType: WearableDataType;

  @Column('decimal', { precision: 10, scale: 2 })
  value: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ type: 'jsonb', nullable: true })
  extras: Record<string, any>;

  @Column({ type: 'enum', enum: WearableSyncStatus, default: WearableSyncStatus.COMPLETE })
  status: WearableSyncStatus;

  @Column({ type: 'timestamptz' })
  recordedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
