import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('equipo')
@Unique(['nombre'])
export class Equipo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ type: 'varchar', length: 100 })
  ciudad!: string;

  @Column({ name: 'fecha_fundacion', type: 'date', nullable: true })
  fechaFundacion!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  descripcion!: string | null;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'datetime', precision: 0 })
  fechaCreacion!: Date;
}
