import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('police_stations')
export class PoliceStation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 150 })
  name!: string;

  @Column({ length: 300 })
  address!: string;

  @Column({ length: 30 })
  contact_number!: string;

  @Column('double precision', { nullable: true })
  latitude?: number | null;

  @Column('double precision', { nullable: true })
  longitude?: number | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
