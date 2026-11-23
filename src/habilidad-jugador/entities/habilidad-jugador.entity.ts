import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Habilidad } from '../../habilidad/entities/habilidad.entity';
import { Jugador } from '../../jugador/entities/jugador.entity';

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

  @CreateDateColumn({ name: 'fecha_asignacion', type: 'datetime', precision: 0 })
  fechaAsignacion!: Date;
}
