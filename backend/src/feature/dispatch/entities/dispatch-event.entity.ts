import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DispatchEventAction } from 'src/constants/dispatch.constants';
import { Case } from 'src/feature/cases/entities/case.entity';
import { PatrolUnit } from 'src/feature/patrol-units/entities/patrol-unit.entity';
import { User } from 'src/feature/user/entities/user.entity';

@Entity('dispatch_events')
@Index('idx_dispatch_events_created_at', ['created_at'])
@Index('idx_dispatch_events_unit_id', ['unit_id'])
@Index('idx_dispatch_events_case_id', ['case_id'])
export class DispatchEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: DispatchEventAction,
    enumName: 'dispatch_event_action',
  })
  action!: DispatchEventAction;

  @Column({ type: 'uuid', nullable: true })
  unit_id?: string | null;

  @ManyToOne(() => PatrolUnit, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'unit_id' })
  unit?: PatrolUnit | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  unit_name?: string | null;

  @Column({ type: 'uuid', nullable: true })
  case_id?: string | null;

  @ManyToOne(() => Case, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'case_id' })
  case?: Case | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  case_number?: string | null;

  @Column({ type: 'uuid', nullable: true })
  officer_id?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'officer_id' })
  officer?: User | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  officer_name?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
