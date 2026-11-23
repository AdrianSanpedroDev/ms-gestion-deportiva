import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('deporte')
@Unique(['nombre'])
export class Deporte {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  descripcion!: string | null;

  @ManyToOne(() => Deporte, (deporte) => deporte.subdeportes, {
    nullable: true,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'deporte_padre_id' })
  deportePadre!: Deporte | null;

  @OneToMany(() => Deporte, (deporte) => deporte.deportePadre)
  subdeportes!: Deporte[];

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @CreateDateColumn({
    name: 'fecha_creacion',
    type: 'datetime',
    precision: 0,
  })
  fechaCreacion!: Date;
}
