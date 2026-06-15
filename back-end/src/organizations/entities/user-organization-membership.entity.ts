import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_organization_memberships')
@Index(['userId', 'organizationId'], { unique: true })
export class UserOrganizationMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid' })
  roleId: string;

  @CreateDateColumn()
  createdAt: Date;
}
