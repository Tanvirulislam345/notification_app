import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Channel, NotificationStatus } from '../../common/enums';

/** Append-only-ish audit record for every notification attempt (at-least-once). */
@Entity('notification_logs')
@Index(['userId', 'createdAt'])
@Index(['status'])
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: Channel, enumName: 'channel_enum' })
  channel: Channel;

  @Column({ type: 'uuid', nullable: true })
  templateId: string | null;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    enumName: 'notification_status_enum',
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  /** Full resolved payload (recipient, subject, body, variables). */
  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastAttemptAt: Date | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  /** End-to-end tracing id, created at the producer and carried everywhere. */
  @Index()
  @Column({ type: 'uuid' })
  correlationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
