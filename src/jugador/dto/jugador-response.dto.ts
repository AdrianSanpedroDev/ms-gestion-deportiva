import { TipoDocumento } from '../entities/tipo-documento.enum';

export class JugadorResponseDto {
  id!: number;
  tipoDocumento!: TipoDocumento;
  numeroDocumento!: string;
  nombres!: string;
  apellidos!: string;
  nombreCompleto!: string;
  fechaNacimiento!: string;
  edad!: number;
  email!: string | null;
  telefono!: string | null;
  activo!: boolean;
  fechaCreacion!: string;
}
