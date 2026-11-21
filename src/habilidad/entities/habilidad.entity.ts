import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CategoriaHabilidad } from './categoria-habilidad.enum';

// Tabla habilidad (sección 6.6). No tiene "activo": no se desactiva, solo se elimina.
@Entity('habilidad')
export class Habilidad {
  @PrimaryGeneratedColumn()
  id!: number;

  // UNIQUE de una sola columna → unique: true en la columna (en jugador era la pareja → @Unique en la clase).
  @Column({ type: 'varchar', length: 100, unique: true })
  nombre!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  descripcion!: string | null;

  // El enum se guarda como texto.
  @Column({ type: 'varchar', length: 20 })
  categoria!: CategoriaHabilidad;

  // DATETIME sin microsegundos (precision 0; TypeORM usa 6 por defecto). Llega como Date, no como texto:
  // el mapper lo pasa a "yyyy-MM-ddTHH:mm:ss" con aFechaHoraIso.
  @CreateDateColumn({
    name: 'fecha_creacion',
    type: 'datetime',
    precision: 0,
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaCreacion!: Date;
}
