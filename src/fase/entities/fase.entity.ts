import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  ChildEntity,
  TableInheritance,
} from 'typeorm';
import { Torneo } from '../../torneo/entities/torneo.entity';
import { TipoFase } from './tipo-fase.enum';

@Entity('fase')
@TableInheritance({ column: { type: 'varchar', name: 'tipo' } })
export class Fase {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Torneo, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'torneo_id' })
  torneo!: Torneo;

  @Column({ type: 'varchar', length: 30 })
  nombre!: string;

  @Column({ type: 'int' })
  orden!: number;

  @Column({ type: 'varchar', length: 20 })
  tipo!: TipoFase;
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
