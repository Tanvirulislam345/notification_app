import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** A job that exhausted all retries. Inspectable + manually retriable by admins. */
@Entity('dead_letter_records')
export class DeadLetterRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  notificationLogId: string;

  @Column({ type: 'text' })
  reason: string;

  /** Original job payload, kept verbatim so a retry can re-enqueue it. */
  @Column({ type: 'jsonb' })
  rawPayload: Record<string, unknown>;

  /** Whether this DLQ entry has since been manually retried. */
  @Column({ type: 'boolean', default: false })
  retried: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
