import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
// TODO: Equipo es de A (ACUERDOS 6.2 y 6.14); compila cuando A suba equipo/entities/equipo.entity.ts
import { Equipo } from '../../equipo/entities/equipo.entity';
import { Grupo } from './fase.entity';

// Tabla grupo_equipo (ACUERDOS 6.11, 6.14 y 13.1): equipos asignados a un Grupo.
// Al eliminar un Grupo se borran sus filas de grupo_equipo por CASCADE, sin eliminar Equipo.
// Sin @OneToMany en Equipo (entidad de A, ACUERDOS 6.14).
@Entity('grupo_equipo')
@Unique(['grupo', 'equipo'])
export class GrupoEquipo {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Grupo, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grupo_id' })
  grupo!: Grupo;

  @ManyToOne(() => Equipo, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'equipo_id' })
  equipo!: Equipo;
}
