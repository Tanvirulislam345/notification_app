import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'uuid', nullable: true })
  ownerId: string;

  @Column({ type: 'varchar', default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
