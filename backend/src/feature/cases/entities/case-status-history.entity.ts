import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CaseStatus } from 'src/constants/cases.constants';
import { User } from 'src/feature/user/entities/user.entity';
import { Case } from './case.entity';

@Entity('case_status_history')
export class CaseStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  case_id!: string;

  @ManyToOne(() => Case, (caseEntity) => caseEntity.status_history, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'case_id' })
  case!: Case;

  @Column({
    type: 'enum',
    enum: CaseStatus,
    enumName: 'case_status',
  })
  status!: CaseStatus;

  @Column({ type: 'uuid', nullable: true })
  changed_by_id?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'changed_by_id' })
  changed_by?: User | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
