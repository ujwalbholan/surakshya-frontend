import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PoliceStation } from 'src/feature/police-stations/entities/police-station.entity';
import { User } from 'src/feature/user/entities/user.entity';

@Entity('police_invites')
@Index('idx_police_invites_email', ['email'])
@Index('idx_police_invites_token_hash', ['token_hash'])
export class PoliceInvite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  email!: string;

  @Column({ length: 150 })
  full_name!: string;

  @Column({ length: 30 })
  phone!: string;

  @Column({ type: 'uuid' })
  station_id!: string;

  @ManyToOne(() => PoliceStation, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'station_id' })
  station!: PoliceStation;

  @Column({ type: 'text' })
  token_hash!: string;

  @Column({ type: 'text' })
  temp_password_hash!: string;

  @Column({ type: 'uuid' })
  invited_by!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'invited_by' })
  inviter!: User;

  @Column({ type: 'timestamptz' })
  expires_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  used_at?: Date | null;

  @CreateDateColumn()
  created_at!: Date;
}
