import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type RequestDirection = 'CHILD_TO_GUARDIAN' | 'GUARDIAN_TO_CHILD';
export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

@Entity('guardian_requests')
@Index('idx_guardian_requests_requester', ['requester_id'])
@Index('idx_guardian_requests_target_email', ['target_email'])
@Index('idx_guardian_requests_status', ['status'])
export class GuardianRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  requester_id: string;

  @Column({ length: 150 })
  requester_name: string;

  @Column({ length: 255 })
  target_email: string;

  @Column({ length: 30 })
  target_phone: string;

  @Column({ length: 150 })
  target_name: string;

  @Column({ type: 'varchar', length: 20 })
  direction: RequestDirection;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: RequestStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
