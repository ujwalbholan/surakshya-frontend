import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CasePriority, CaseStatus } from 'src/constants/cases.constants';
import { SosEvent } from 'src/feature/device/entities/sos-event.entity';
import { PatrolUnit } from 'src/feature/patrol-units/entities/patrol-unit.entity';
import { PoliceStation } from 'src/feature/police-stations/entities/police-station.entity';
import { User } from 'src/feature/user/entities/user.entity';
import { CaseNote } from './case-note.entity';
import { CaseStatusHistory } from './case-status-history.entity';

@Entity('cases')
@Index('idx_cases_status', ['status'])
@Index('idx_cases_station', ['station_id'])
@Index('idx_cases_sos_event_id', ['sos_event_id'])
export class Case {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  case_number!: string;

  @Column({
    type: 'enum',
    enum: CaseStatus,
    enumName: 'case_status',
    default: CaseStatus.OPEN,
  })
  status!: CaseStatus;

  @Column({
    type: 'enum',
    enum: CasePriority,
    enumName: 'case_priority',
    default: CasePriority.MEDIUM,
  })
  priority!: CasePriority;

  @Column({ type: 'text' })
  summary!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  district?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  province?: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  victim_name?: string | null;

  @Column({ type: 'uuid', nullable: true })
  sos_event_id?: string | null;

  @ManyToOne(() => SosEvent, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sos_event_id' })
  sos_event?: SosEvent | null;

  @Column({ type: 'uuid', nullable: true })
  station_id?: string | null;

  @ManyToOne(() => PoliceStation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'station_id' })
  station?: PoliceStation | null;

  @Column({ type: 'uuid', nullable: true })
  assigned_officer_id?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_officer_id' })
  assigned_officer?: User | null;

  @Column({ type: 'uuid', nullable: true })
  assigned_unit_id?: string | null;

  @ManyToOne(() => PatrolUnit, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_unit_id' })
  assigned_unit?: PatrolUnit | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  opened_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  closed_at?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @OneToMany(() => CaseStatusHistory, (history) => history.case)
  status_history?: CaseStatusHistory[];

  @OneToMany(() => CaseNote, (note) => note.case)
  notes?: CaseNote[];
}
