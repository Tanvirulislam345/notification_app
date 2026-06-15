import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('role_permissions')
@Index(['roleId', 'permissionId'], { unique: true })
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  roleId: string;

  @Column({ type: 'uuid' })
  permissionId: string;
}
