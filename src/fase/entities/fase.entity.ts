import {
  ChildEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  TableInheritance,
  Unique,
} from 'typeorm';
// TODO: Torneo es de A (ACUERDOS 6.8 y 6.14); compila cuando A suba torneo/entities/torneo.entity.ts
import { Torneo } from '../../torneo/entities/torneo.entity';
import { TipoFase } from './tipo-fase.enum';

// Tabla fase con herencia en una sola tabla (Single Table Inheritance, ACUERDOS 6.11 y 13.1).
// "tipo" es la columna discriminadora que gestiona TypeORM (no se declara como propiedad).
// Sin @OneToMany en Torneo (entidad de A, ACUERDOS 6.14).
@Entity('fase')
@TableInheritance({ column: { type: 'varchar', length: 20, name: 'tipo' } })
@Unique(['torneo', 'nombre'])
export abstract class Fase {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Torneo, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'torneo_id' })
  torneo!: Torneo;

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ type: 'int' })
  orden!: number;

  // DATETIME sin microsegundos (ACUERDOS 5.5): TypeORM 1.1.2 lo hidrata como Date.
  @CreateDateColumn({
    name: 'fecha_creacion',
    type: 'datetime',
    precision: 0,
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaCreacion!: Date;
}

@ChildEntity(TipoFase.GRUPO)
export class Grupo extends Fase {}

@ChildEntity(TipoFase.FINAL)
export class FaseFinal extends Fase {
  @Column({ name: 'cantidad_equipos', type: 'int', nullable: true })
  cantidadEquipos!: number;

  @Column({ name: 'tercer_puesto', type: 'boolean', nullable: true })
  tercerPuesto!: boolean;
}
