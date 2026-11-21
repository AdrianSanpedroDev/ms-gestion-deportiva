import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
// TODO: Equipo es de A (6.2 y 6.14); compila cuando A suba equipo/entities/equipo.entity.ts
import { Equipo } from '../../equipo/entities/equipo.entity';
// TODO: Escenario es de A (6.9 y 6.14); compila cuando A suba escenario/entities/escenario.entity.ts
import { Escenario } from '../../escenario/entities/escenario.entity';
// TODO: Fase es de C (6.11 y 6.14); compila cuando C suba fase/entities/fase.entity.ts
import { Fase } from '../../fase/entities/fase.entity';
// TODO: RondaFinal es de C (6.11 y 6.14); compila cuando C suba fase/entities/ronda-final.enum.ts
import { RondaFinal } from '../../fase/entities/ronda-final.enum';
import { EstadoPartido } from './estado-partido.enum';

// Tabla partido (6.12). Es la "clase de asociación" entre dos equipos (como Screening en ms-cinema):
// pertenece a una Fase y puede tener un Escenario. Todas las FK viven en ESTA tabla (lado "muchos").
// Sin @OneToMany en Fase, Equipo ni Escenario: son de A y C, y desde aquí basta con where/countBy (6.14).
@Entity('partido')
export class Partido {
  @PrimaryGeneratedColumn()
  id!: number;

  // Muchos partidos → una fase (columna FK fase_id). La fase dice si es GRUPO o FINAL y de qué torneo es.
  @ManyToOne(() => Fase, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'fase_id' })
  fase!: Fase;

  // Dos relaciones a la MISMA entidad Equipo: por eso cada una necesita su propio nombre de columna.
  @ManyToOne(() => Equipo, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'equipo_local_id' })
  equipoLocal!: Equipo;

  @ManyToOne(() => Equipo, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'equipo_visitante_id' })
  equipoVisitante!: Equipo;

  // DATETIME tipado Date (ACUERDOS 5.5 dice string, pero TypeORM 1.1.2 lo entrega como Date de todos modos):
  // - Lectura: el driver hace new Date(texto) con la hora LOCAL aunque dateStrings sea true; el mapper lo
  //   devuelve a "2026-12-05T15:30:00" con aFechaHoraIso (getters locales).
  // - Escritura: PartidoMapper.aDatosEntidad hace new Date(dto.fechaHora) SIN "Z" → también hora LOCAL. La ida y vuelta solo
  //   cuadra si el proceso corre en hora de Bogotá: hoy app.module.ts NO tiene dateStrings ni timezone.
  // - Para validar "dentro del torneo" se compara TEXTO: dto.fechaHora.slice(0, 10) con >= fechaInicio y
  //   <= fechaFin (sin el slice, '2026-12-20T15:30:00' <= '2026-12-20' da false: ver crear-partido.dto.ts).
  @Column({ name: 'fecha_hora', type: 'datetime' })
  fechaHora!: Date;

  // El escenario es opcional ("cuando corresponda"): FK que admite NULL.
  @ManyToOne(() => Escenario, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'escenario_id' })
  escenario!: Escenario | null;

  // Solo en partidos de la fase FINAL; en un GRUPO va en NULL (6.12).
  @Column({ type: 'varchar', length: 20, nullable: true })
  ronda!: RondaFinal | null;

  @Column({ name: 'numero_llave', type: 'int', nullable: true })
  numeroLlave!: number | null;

  // Se guarda como texto, tipado con el enum. El service lo pone en PROGRAMADO al crear.
  @Column({ type: 'varchar', length: 20 })
  estado!: EstadoPartido;

  // NULL = todavía no hay resultado registrado (tieneResultado = false en la respuesta).
  @Column({ name: 'marcador_local', type: 'int', nullable: true })
  marcadorLocal!: number | null;

  @Column({ name: 'marcador_visitante', type: 'int', nullable: true })
  marcadorVisitante!: number | null;

  // DATETIME sin microsegundos (precision 0; TypeORM usa 6 por defecto). Llega como Date.
  @CreateDateColumn({
    name: 'fecha_creacion',
    type: 'datetime',
    precision: 0,
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaCreacion!: Date;
}
