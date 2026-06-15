import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'varchar' })
  refreshTokenHash: string;

  @Column({ type: 'jsonb', nullable: true })
  deviceInfo: Record<string, string>;

  @Column({ type: 'varchar', nullable: true })
  ipAddress: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastActive: Date;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
