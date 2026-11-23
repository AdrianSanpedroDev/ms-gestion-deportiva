import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Equipo } from '../../equipo/entities/equipo.entity';
import { Jugador } from './jugador.entity';

// Tabla equipo_jugador (6.5): un CONTRATO entre un equipo y un jugador. Las filas nunca se borran (historial de traspasos).
// SIN @Unique(['equipo', 'jugador']): un jugador retirado puede volver a firmar con el mismo equipo (fila nueva),
// así que la pareja SÍ se repite en el historial. La regla "un solo contrato ACTIVO por pareja" la revisa el service.
@Entity('equipo_jugador')
export class EquipoJugador {
  @PrimaryGeneratedColumn()
  id!: number;

  // Muchos contratos → un equipo. La columna FK equipo_id vive en ESTA tabla (el lado "muchos").
  @ManyToOne(() => Equipo, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'equipo_id' })
  equipo!: Equipo;

  // Muchos contratos → un jugador (columna FK jugador_id).
  @ManyToOne(() => Jugador, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'jugador_id' })
  jugador!: Jugador;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio!: string;

  @Column({ name: 'fecha_fin', type: 'date' })
  fechaFin!: string;

  // NULL mientras el contrato está activo; se llena al retirar.
  @Column({ name: 'fecha_retiro', type: 'date', nullable: true })
  fechaRetiro!: string | null;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;
}
