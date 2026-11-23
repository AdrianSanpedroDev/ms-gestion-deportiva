import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('escenario')
@Unique(['nombre'])
export class Escenario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion!: string | null;

  @Column({ type: 'int', nullable: true })
  capacidad!: number | null;

  @ManyToOne(() => Escenario, (escenario) => escenario.subescenarios, {
    nullable: true,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'escenario_padre_id' })
  escenarioPadre!: Escenario | null;

  @OneToMany(() => Escenario, (escenario) => escenario.escenarioPadre)
  subescenarios!: Escenario[];
}
