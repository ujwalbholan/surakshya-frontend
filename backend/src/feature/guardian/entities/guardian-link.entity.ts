import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from 'src/feature/user/entities/user.entity';

@Entity('guardian_links')
@Unique('uq_guardian_links_child_guardian', [
  'child_user_id',
  'guardian_user_id',
])
@Index('idx_guardian_links_child', ['child_user_id'])
@Index('idx_guardian_links_guardian', ['guardian_user_id'])
export class GuardianLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  child_user_id: string;

  @Column('uuid')
  guardian_user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'child_user_id' })
  child: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'guardian_user_id' })
  guardian: User;

  /** Exactly one emergency contact per child is enforced in service logic. */
  @Column({ type: 'boolean', default: false })
  is_emergency_contact: boolean;

  @CreateDateColumn()
  created_at: Date;
}
