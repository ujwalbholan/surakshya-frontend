import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('admin_settings')
export class AdminSetting {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  key!: string;

  @Column({ type: 'jsonb' })
  value!: unknown;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
