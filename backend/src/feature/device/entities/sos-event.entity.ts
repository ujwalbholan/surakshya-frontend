import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Device } from './device.entity';
import { User } from 'src/feature/user/entities/user.entity';

@Entity('sos_events')
export class SosEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Device, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device!: Device;

  @Column({ default: 'active' })
  status!: 'active' | 'resolved';

  @Column({ type: 'varchar', length: 50, nullable: true })
  eventType?: string | null;

  @Column('double precision', { nullable: true })
  latitude?: number | null;

  @Column('double precision', { nullable: true })
  longitude?: number | null;

  @Column({ type: 'double precision', nullable: true })
  altitudeM?: number | null;

  @Column({ type: 'double precision', nullable: true })
  speedKmph?: number | null;

  @Column({ type: 'int', nullable: true })
  satellites?: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'resolved_by' })
  resolvedBy?: User | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @CreateDateColumn()
  startedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt?: Date | null;
}
