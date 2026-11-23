import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Deporte } from '../../deporte/entities/deporte.entity';
import { Equipo } from './equipo.entity';

@Entity('equipo_deporte')
@Unique(['equipo', 'deporte'])
export class EquipoDeporte {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Equipo, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'equipo_id' })
  equipo!: Equipo;

  @ManyToOne(() => Deporte, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'deporte_id' })
  deporte!: Deporte;

  @CreateDateColumn({ name: 'fecha_asociacion', type: 'datetime', precision: 0 })
  fechaAsociacion!: Date;
}
