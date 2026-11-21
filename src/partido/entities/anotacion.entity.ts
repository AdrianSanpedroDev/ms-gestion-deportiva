import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Jugador } from '../../jugador/entities/jugador.entity';
import { Partido } from './partido.entity';

// Tabla anotacion (6.13). Se adelanta en GC-06 porque PartidoResponse lleva cantidadAnotaciones
// y un partido con anotaciones no se puede eliminar (409). Las reglas de anotaciones son de GC-07.
// Sin @OneToMany en Partido ni en Jugador: desde aquí basta con countBy({ partido: { id } }).
@Entity('anotacion')
export class Anotacion {
  @PrimaryGeneratedColumn()
  id!: number;

  // Muchas anotaciones → un partido (columna FK partido_id en ESTA tabla).
  @ManyToOne(() => Partido, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'partido_id' })
  partido!: Partido;

  // Muchas anotaciones → un jugador (columna FK jugador_id).
  @ManyToOne(() => Jugador, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'jugador_id' })
  jugador!: Jugador;

  // Minuto del partido; NULL si no se registró.
  @Column({ type: 'int', nullable: true })
  minuto!: number | null;

  // Puntos de la anotación (1 gol, 3 un triple...). Default 1 en la tabla.
  @Column({ type: 'int', default: 1 })
  valor!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion!: string | null;

  // DATETIME NOT NULL que se llena al crear (6.14) → @CreateDateColumn, sin microsegundos (precision 0).
  // Llega como Date: el mapper de GC-07 lo pasa a "yyyy-MM-ddTHH:mm:ss" con aFechaHoraIso.
  @CreateDateColumn({
    name: 'fecha_registro',
    type: 'datetime',
    precision: 0,
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaRegistro!: Date;
}
