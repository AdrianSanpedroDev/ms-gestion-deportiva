import { aFechaHoraIso } from '../../common/utils/fechas';
import { EquipoResumenMapper } from '../../jugador/mappers/equipo-resumen.mapper';
import { tieneResultado } from '../../partido/entities/estado-partido.enum';
import type { Partido } from '../../partido/entities/partido.entity';
import type {
  LlavesResponseDto,
  RondaLlavesDto,
} from '../dto/llaves-response.dto';
import type { PartidoResumen } from '../../common/dto/partido-resumen.dto';
import type { FaseFinal } from '../entities/fase.entity';
import { FaseMapper } from './fase.mapper';

// Mapper puro de fase final y llaves (HU-GC-05 y HU-GC-08, ACUERDOS 4.1, 5.6 y 9.16).
// Transforma entidades en DTOs sin reglas de negocio ni acceso a BD.
export class FaseFinalMapper {
  // Requiere partido.equipoLocal y partido.equipoVisitante cargados.
  static aPartidoResumen(partido: Partido): PartidoResumen {
    return {
      id: partido.id,
      equipoLocal: EquipoResumenMapper.aResumen(partido.equipoLocal),
      equipoVisitante: EquipoResumenMapper.aResumen(partido.equipoVisitante),
      fechaHora: aFechaHoraIso(partido.fechaHora),
      estado: partido.estado,
      marcadorLocal: partido.marcadorLocal ?? null,
      marcadorVisitante: partido.marcadorVisitante ?? null,
      tieneResultado: tieneResultado(partido),
      ronda: partido.ronda ?? null,
      numeroLlave: partido.numeroLlave ?? null,
    };
  }

  static aLlavesResponse(
    faseFinal: FaseFinal,
    rondas: RondaLlavesDto[],
  ): LlavesResponseDto {
    return {
      fase: FaseMapper.aResumen(faseFinal),
      cantidadEquipos: faseFinal.cantidadEquipos,
      tercerPuesto: Boolean(faseFinal.tercerPuesto),
      rondas,
    };
  }
}
