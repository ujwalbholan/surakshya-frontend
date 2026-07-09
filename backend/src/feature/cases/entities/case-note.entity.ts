import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/feature/user/entities/user.entity';
import { Case } from './case.entity';

@Entity('case_notes')
export class CaseNote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  case_id!: string;

  @ManyToOne(() => Case, (caseEntity) => caseEntity.notes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'case_id' })
  case!: Case;

  @Column({ type: 'uuid', nullable: true })
  author_id?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'author_id' })
  author?: User | null;

  @Column({ type: 'text' })
  body!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
