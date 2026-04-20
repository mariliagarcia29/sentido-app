import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('token_blacklist')
export class TokenBlacklist {
  @PrimaryColumn()
  jti: string;

  @Column()
  userId: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;
}
