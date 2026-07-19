import {
  Entity, PrimaryGeneratedColumn, Column, Index, UpdateDateColumn,
} from 'typeorm';

@Entity('clinic_role_permissions')
@Index(['clinicId', 'roleKey', 'permission'], { unique: true })
export class ClinicRolePermission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  clinicId!: string;

  // e.g., 'doctor', 'doctor:psicologo', 'clinic:secretaria'
  @Column({ length: 60 })
  roleKey!: string;

  // Permission enum value
  @Column({ length: 60 })
  permission!: string;

  // true = conceder, false = revogar explicitamente
  @Column({ default: true })
  granted!: boolean;

  @Column({ type: 'varchar', nullable: true })
  updatedBy!: string | null;

  @UpdateDateColumn()
  updatedAt!: Date;
}
