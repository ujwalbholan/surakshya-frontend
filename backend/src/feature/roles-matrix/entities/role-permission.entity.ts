import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('role_permissions')
@Unique('UQ_role_permissions_role_permission', ['role', 'permission'])
@Index('idx_role_permissions_role', ['role'])
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  role!: string;

  @Column({ type: 'varchar', length: 100 })
  permission!: string;

  @Column({ type: 'boolean', default: false })
  allowed!: boolean;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
