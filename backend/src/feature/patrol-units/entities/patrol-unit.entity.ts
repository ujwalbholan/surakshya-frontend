import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UnitStatus } from 'src/constants/patrol-units.constants';
import { PoliceStation } from 'src/feature/police-stations/entities/police-station.entity';
import { User } from 'src/feature/user/entities/user.entity';

@Entity('patrol_units')
@Index('idx_patrol_units_station', ['station_id'])
@Index('idx_patrol_units_status', ['status'])
export class PatrolUnit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  vehicle!: string;

  @Column({ type: 'varchar', length: 100 })
  zone!: string;

  @Column({ type: 'varchar', length: 50 })
  province!: string;

  @Column({
    type: 'enum',
    enum: UnitStatus,
    enumName: 'unit_status',
    default: UnitStatus.AVAILABLE,
  })
  status!: UnitStatus;

  @Column({ type: 'uuid', nullable: true })
  station_id?: string | null;

  @ManyToOne(() => PoliceStation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'station_id' })
  station?: PoliceStation | null;

  @Column({ type: 'uuid', nullable: true })
  lead_officer_id?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lead_officer_id' })
  lead_officer?: User | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  contact_phone?: string | null;

  @Column('double precision', { nullable: true })
  latitude?: number | null;

  @Column('double precision', { nullable: true })
  longitude?: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
