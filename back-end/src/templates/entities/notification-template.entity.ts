import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Channel } from '../../common/enums';

/** Reusable message template with `{{variable}}` interpolation support. */
@Entity('notification_templates')
@Unique(['name', 'channel'])
export class NotificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'enum', enum: Channel, enumName: 'channel_enum' })
  channel: Channel;

  /** Email subject line (unused for IN_APP but kept for uniformity). */
  @Column({ type: 'varchar', nullable: true })
  subject: string | null;

  /** Body template, supports `{{firstName}}`-style placeholders. */
  @Column({ type: 'text' })
  bodyTemplate: string;
}
