import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Habilidad } from '../../habilidad/entities/habilidad.entity';
import { Jugador } from '../../jugador/entities/jugador.entity';

// Tabla habilidad_jugador (ACUERDOS 6.7 y 6.14): clase asociativa N:N entre Habilidad y Jugador.
// Retirar una habilidad = borrar la fila; ni la habilidad ni el jugador se eliminan.
// Sin @OneToMany en Jugador ni en Habilidad (entidades de B, ACUERDOS 6.14 y 13.3).
@Entity('habilidad_jugador')
@Unique(['habilidad', 'jugador'])
export class HabilidadJugador {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Habilidad, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'habilidad_id' })
  habilidad!: Habilidad;

  @ManyToOne(() => Jugador, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'jugador_id' })
  jugador!: Jugador;

  // DATETIME sin microsegundos (ACUERDOS 5.5): TypeORM 1.1.2 lo hidrata como Date.
  @CreateDateColumn({
    name: 'fecha_asignacion',
    type: 'datetime',
    precision: 0,
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaAsignacion!: Date;
}
