import { TipoDocumento } from '../../jugador/entities/tipo-documento.enum';

export class JugadorResumenDto {
  id!: number;
  tipoDocumento!: TipoDocumento;
  numeroDocumento!: string;
  nombreCompleto!: string;
  activo!: boolean;
}
export { JugadorResumenDto as JugadorResumen };
