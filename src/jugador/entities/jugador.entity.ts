import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { TipoDocumento } from './tipo-documento.enum';

@Entity('jugador')
@Unique(['tipoDocumento', 'numeroDocumento'])
export class Jugador {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'tipo_documento', type: 'varchar', length: 20 })
  tipoDocumento!: TipoDocumento;

  @Column({ name: 'numero_documento', type: 'varchar', length: 20 })
  numeroDocumento!: string;

  @Column({ type: 'varchar', length: 100 })
  nombres!: string;

  @Column({ type: 'varchar', length: 100 })
  apellidos!: string;

  @Column({ name: 'fecha_nacimiento', type: 'date' })
  fechaNacimiento!: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono!: string | null;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

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
