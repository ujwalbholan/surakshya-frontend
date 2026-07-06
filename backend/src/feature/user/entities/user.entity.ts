import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from 'src/feature/auth/dto/auth.dto';

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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
