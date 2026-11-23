import { DeporteResumenDto } from '../../common/dto/deporte-resumen.dto';
import { EstadoTorneo } from '../entities/estado-torneo.enum';

export class TorneoResponseDto {
  id!: number;
  nombre!: string;
  deporte!: DeporteResumenDto;
  descripcion!: string | null;
  fechaInicio!: string;
  fechaFin!: string;
  fechaCierreInscripciones!: string;
  maxEquipos!: number | null;
  estado!: EstadoTorneo;
  inscripcionesAbiertas!: boolean;
  cantidadInscritos!: number;
  fechaCreacion!: string;
}
