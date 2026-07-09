import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { PoliceStationLinkStatus } from 'src/constants/police-provisioning.constants';
import { PoliceStation } from 'src/feature/police-stations/entities/police-station.entity';
import { User } from 'src/feature/user/entities/user.entity';

@Entity('police_station_links')
@Unique('uq_police_station_links_officer_station', ['officer_id', 'station_id'])
@Index('idx_police_station_links_officer', ['officer_id'])
@Index('idx_police_station_links_station', ['station_id'])
@Index('idx_police_station_links_status', ['status'])
@Index('idx_police_station_links_requested_by', ['requested_by_admin_id'])
export class PoliceStationLink {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  requested_by_admin_id!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'requested_by_admin_id' })
  requested_by_admin!: User;

  @Column('uuid')
  officer_id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'officer_id' })
  officer!: User;

  @Column('uuid')
  station_id!: string;

  @ManyToOne(() => PoliceStation, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'station_id' })
  station!: PoliceStation;

  @Column({
    type: 'enum',
    enum: PoliceStationLinkStatus,
    enumName: 'police_station_link_status',
    default: PoliceStationLinkStatus.PENDING,
  })
  status!: PoliceStationLinkStatus;

  @Column({ type: 'uuid', nullable: true })
  reviewed_by_super_admin_id?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewed_by_super_admin_id' })
  reviewed_by_super_admin?: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewed_at?: Date | null;

  @Column({ type: 'text', nullable: true })
  rejection_reason?: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
