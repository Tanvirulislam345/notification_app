import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar' })
  email: string;

  @Index()
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid' })
  roleId: string;

  @Column({ type: 'varchar', unique: true })
  token: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'uuid' })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
