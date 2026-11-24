import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Equipo } from '../../equipo/entities/equipo.entity';
import { Torneo } from './torneo.entity';

@Entity('inscripcion')
@Unique(['torneo', 'equipo'])
export class Inscripcion {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Torneo, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'torneo_id' })
  torneo!: Torneo;

  @ManyToOne(() => Equipo, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'equipo_id' })
  equipo!: Equipo;

  @CreateDateColumn({
    name: 'fecha_inscripcion',
    type: 'datetime',
    precision: 0,
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaInscripcion!: Date;
}
