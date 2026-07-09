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
import { PoliceAccountStatus } from 'src/constants/police-provisioning.constants';
import { Role } from 'src/feature/auth/dto/auth.dto';
import { PoliceStation } from 'src/feature/police-stations/entities/police-station.entity';

@Entity('users')
@Index('idx_users_phone', ['phone'])
@Index('idx_users_role', ['role'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  full_name: string;

  @Column({ length: 255, unique: true, nullable: true })
  email: string;

  @Column({ length: 30, unique: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  password_hash: string;

  @Column({
    type: 'enum',
    enum: Role,
    enumName: 'user_role',
    default: Role.USER,
  })
  role: Role;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  phone_verified: boolean;

  @Column({
    type: 'enum',
    enum: PoliceAccountStatus,
    enumName: 'police_account_status',
    nullable: true,
  })
  police_account_status?: PoliceAccountStatus | null;

  @Column({ default: false })
  must_change_password: boolean;

  @Column({ type: 'text', nullable: true })
  temp_password_hash?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  temp_password_expires_at?: Date | null;

  @Column({ type: 'int', default: 0 })
  temp_password_resend_count: number;

  @Column({ type: 'timestamptz', nullable: true })
  temp_password_last_resend_at?: Date | null;

  @Column({ type: 'uuid', nullable: true })
  station_id?: string | null;

  @ManyToOne(() => PoliceStation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'station_id' })
  station?: PoliceStation | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
