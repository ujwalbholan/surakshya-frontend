import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Device } from './device.entity';
import { SosEvent } from './sos-event.entity';

@Entity('location_pings')
export class LocationPing {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Device, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device!: Device;

  @ManyToOne(() => SosEvent, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sos_event_id' })
  sosEvent?: SosEvent | null;

  @Column('double precision')
  latitude!: number;

  @Column('double precision')
  longitude!: number;

  @Column({ type: 'double precision', nullable: true })
  altitudeM?: number;

  @Column({ type: 'double precision', nullable: true })
  speedKmph?: number;

  @Column({ type: 'int', nullable: true })
  satellites?: number;

  @Column({ type: 'double precision', nullable: true })
  hdop?: number;

  @CreateDateColumn()
  recordedAt!: Date;
}
