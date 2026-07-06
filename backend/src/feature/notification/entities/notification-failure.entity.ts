import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notification_failures')
export class NotificationFailure {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 10 })
  type!: 'sms' | 'email';

  @Column({ length: 255 })
  recipient!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'text' })
  error!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
