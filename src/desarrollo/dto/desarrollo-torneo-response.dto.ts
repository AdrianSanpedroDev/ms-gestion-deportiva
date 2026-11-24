import type { DeporteResumen } from '../../common/dto/deporte-resumen.dto';
import type { EquipoResumen } from '../../common/dto/equipo-resumen.dto';
import type { PartidoResumen } from '../../common/dto/partido-resumen.dto';
import type { FilaPosicionDto } from '../../fase/dto/fila-posicion.dto';
import type { RondaLlavesDto } from '../../fase/dto/llaves-response.dto';
import type { TipoFase } from '../../fase/entities/tipo-fase.enum';
import type { EstadoTorneo } from '../../torneo/entities/estado-torneo.enum';

// Información general del torneo dentro del desarrollo consolidado (HU-GC-08, ACUERDOS 9.17).
export interface TorneoDesarrolloDto {
  id: number;
  nombre: string;
  deporte: DeporteResumen;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoTorneo;
  cantidadInscritos: number;
}

// Contadores globales de partidos del torneo (HU-GC-08, ACUERDOS 9.17).
// pendientes excluye partidos en estado CANCELADO sin resultado.
export interface ResumenDesarrolloDto {
  totalPartidos: number;
  conResultado: number;
  pendientes: number;
}

// Detalle de cada fase en el desarrollo del torneo (HU-GC-08, ACUERDOS 9.17).
// - GRUPO: equipos + tablaPosiciones poblados, llaves = null.
// - FINAL: equipos = null, tablaPosiciones = null, llaves poblado.
export interface FaseDesarrolloDto {
  id: number;
  nombre: string;
  tipo: TipoFase;
  orden: number;
  equipos: EquipoResumen[] | null;
  tablaPosiciones: FilaPosicionDto[] | null;
  llaves: RondaLlavesDto[] | null;
  partidos: PartidoResumen[];
}

// Respuesta de GET /api/torneos/{torneoId}/desarrollo (HU-GC-08, ACUERDOS 9.17).
export interface DesarrolloTorneoResponseDto {
  torneo: TorneoDesarrolloDto;
  resumen: ResumenDesarrolloDto;
  fases: FaseDesarrolloDto[];
}
