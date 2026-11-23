import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Deporte } from '../../deporte/entities/deporte.entity';
import { EstadoTorneo } from './estado-torneo.enum';

@Entity('torneo')
@Unique(['nombre'])
export class Torneo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  @ManyToOne(() => Deporte, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'deporte_id' })
  deporte!: Deporte;

  @Column({ type: 'varchar', length: 500, nullable: true })
  descripcion!: string | null;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio!: string;

  @Column({ name: 'fecha_fin', type: 'date' })
  fechaFin!: string;

  @Column({ name: 'fecha_cierre_inscripciones', type: 'date' })
  fechaCierreInscripciones!: string;

  @Column({ name: 'max_equipos', type: 'int', nullable: true })
  maxEquipos!: number | null;

  @Column({ type: 'varchar', length: 30 })
  estado!: EstadoTorneo;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'datetime', precision: 0 })
  fechaCreacion!: Date;
}
