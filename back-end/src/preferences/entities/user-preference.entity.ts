import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Channel } from '../../common/enums';
import { User } from '../../users/entities/user.entity';

/** One row per (user, channel): opt-in flag, quiet hours, and channel priority. */
@Entity('user_preferences')
@Unique(['userId', 'channel'])
export class UserPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.preferences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: Channel, enumName: 'channel_enum' })
  channel: Channel;

  @Column({ type: 'boolean', default: true })
  optedIn: boolean;

  /** Quiet-hours window start, e.g. `22:00`. Null = no quiet hours. */
  @Column({ type: 'time', nullable: true })
  quietHoursStart: string | null;

  /** Quiet-hours window end, e.g. `08:00`. */
  @Column({ type: 'time', nullable: true })
  quietHoursEnd: string | null;

  /** Lower number = higher priority when multiple channels are eligible. */
  @Column({ type: 'int', default: 100 })
  priority: number;
}
