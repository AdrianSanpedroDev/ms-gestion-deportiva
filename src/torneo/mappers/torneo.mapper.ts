import { DeporteResumenDto } from '../../common/dto/deporte-resumen.dto';
import { aFechaHoraIso, hoyBogota } from '../../common/utils/fechas';
import { EstadoTorneo } from '../entities/estado-torneo.enum';
import { Torneo } from '../entities/torneo.entity';
import { TorneoResponseDto } from '../dto/torneo-response.dto';

export class TorneoMapper {
  static aResponse(torneo: Torneo, cantidadInscritos: number): TorneoResponseDto {
    const deporte: DeporteResumenDto = { id: torneo.deporte.id, nombre: torneo.deporte.nombre, activo: torneo.deporte.activo };
    return {
      id: torneo.id, nombre: torneo.nombre, deporte, descripcion: torneo.descripcion,
      fechaInicio: torneo.fechaInicio, fechaFin: torneo.fechaFin,
      fechaCierreInscripciones: torneo.fechaCierreInscripciones, maxEquipos: torneo.maxEquipos,
      estado: torneo.estado,
      inscripcionesAbiertas: torneo.estado === EstadoTorneo.INSCRIPCIONES_ABIERTAS && hoyBogota() <= torneo.fechaCierreInscripciones,
      cantidadInscritos, fechaCreacion: aFechaHoraIso(torneo.fechaCreacion),
    };
  }
}
