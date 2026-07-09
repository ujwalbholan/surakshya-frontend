import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EvidenceFileType } from 'src/constants/evidence.constants';
import { Case } from 'src/feature/cases/entities/case.entity';
import { User } from 'src/feature/user/entities/user.entity';

@Entity('evidence')
@Index('idx_evidence_case_id', ['case_id'])
@Index('idx_evidence_file_type', ['file_type'])
export class Evidence {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  case_id!: string;

  @ManyToOne(() => Case, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'case_id' })
  case!: Case;

  @Column({ type: 'varchar', length: 255 })
  file_name!: string;

  @Column({ type: 'text' })
  storage_key!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mime_type?: string | null;

  @Column({
    type: 'enum',
    enum: EvidenceFileType,
    enumName: 'evidence_file_type',
  })
  file_type!: EvidenceFileType;

  @Column({ type: 'bigint' })
  size_bytes!: string;

  @Column({ type: 'varchar', length: 64 })
  checksum!: string;

  @Column({ type: 'uuid' })
  uploaded_by_id!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'uploaded_by_id' })
  uploaded_by!: User;

  @Column({ type: 'timestamptz', nullable: true })
  captured_at?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
