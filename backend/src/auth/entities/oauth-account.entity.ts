import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum OauthProvider {
  GOOGLE = 'google',
  APPLE = 'apple',
}

@Entity('oauth_accounts')
@Unique(['provider', 'providerUserId'])
export class OauthAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: OauthProvider })
  provider: OauthProvider;

  @Column()
  providerUserId: string;

  @CreateDateColumn()
  createdAt: Date;
}
