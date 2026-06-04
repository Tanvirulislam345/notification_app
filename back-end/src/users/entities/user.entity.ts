import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserPreference } from '../../preferences/entities/user-preference.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'varchar' })
  name: string;

  /** IANA timezone, e.g. `Asia/Dhaka` — used for quiet-hours evaluation. */
  @Column({ type: 'varchar', default: 'UTC' })
  timezone: string;

  /** Dev convenience flag: admins receive in-app push for bulk actions. */
  @Column({ type: 'boolean', default: false })
  isAdmin: boolean;

  @OneToMany(() => UserPreference, (pref) => pref.user)
  preferences: UserPreference[];

  @CreateDateColumn()
  createdAt: Date;
}
