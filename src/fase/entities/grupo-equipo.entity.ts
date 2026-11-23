import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Equipo } from '../../equipo/entities/equipo.entity';
import { Fase } from './fase.entity';

@Entity('grupo_equipo')
@Unique(['grupo', 'equipo'])
export class GrupoEquipo {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Fase, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'grupo_id' })
  grupo!: Fase;

  @ManyToOne(() => Equipo, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'equipo_id' })
  equipo!: Equipo;
}
