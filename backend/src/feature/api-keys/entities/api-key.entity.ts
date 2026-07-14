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
import { User } from 'src/feature/user/entities/user.entity';

@Entity('api_keys')
@Index('idx_api_keys_prefix', ['prefix'])
@Index('idx_api_keys_revoked_at', ['revoked_at'])
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 32 })
  prefix!: string;

  @Column({ type: 'text' })
  key_hash!: string;

  @Column({ type: 'uuid', nullable: true })
  created_by_id?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_id' })
  created_by?: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  last_used_at?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  revoked_at?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
