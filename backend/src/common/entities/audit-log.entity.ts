import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column()
  action: string;

  @Column({ nullable: true })
  targetResource: string;

  @Column({ nullable: true })
  ipAddress: string;

  @CreateDateColumn({ update: false })
  createdAt: Date;
}
