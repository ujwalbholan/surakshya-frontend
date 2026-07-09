import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AuditAction, AuditResult } from 'src/constants/audit.constants';
import { User } from 'src/feature/user/entities/user.entity';

@Entity('audit_logs')
@Index('idx_audit_logs_created_at', ['created_at'])
@Index('idx_audit_logs_actor', ['actor_user_id'])
@Index('idx_audit_logs_action', ['action'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  actor_user_id?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_user_id' })
  actor?: User | null;

  @Column({ type: 'varchar', length: 50 })
  actor_role!: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
    enumName: 'audit_action',
  })
  action!: AuditAction;

  @Column({ type: 'varchar', length: 50, nullable: true })
  target_entity_type?: string | null;

  @Column({ type: 'uuid', nullable: true })
  target_entity_id?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  target_label?: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address?: string | null;

  @Column({
    type: 'enum',
    enum: AuditResult,
    enumName: 'audit_result',
  })
  result!: AuditResult;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
