import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/feature/user/entities/user.entity';
import { Device } from 'src/feature/device/entities/device.entity';

@Entity('location_access_logs')
export class LocationAccessLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  accessor_user_id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accessor_user_id' })
  accessor!: User;

  @Column({ length: 50 })
  accessor_role!: string;

  @Column({ type: 'uuid', nullable: true })
  target_user_id?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'target_user_id' })
  targetUser?: User | null;

  @Column({ type: 'uuid', nullable: true })
  target_device_id?: string | null;

  @ManyToOne(() => Device, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'target_device_id' })
  targetDevice?: Device | null;

  @Column({ length: 255 })
  endpoint!: string;

  @Column({ type: 'text', nullable: true })
  context?: string | null;

  @CreateDateColumn()
  created_at!: Date;
}
