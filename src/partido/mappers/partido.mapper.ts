// "import type": Equipo, Escenario y Fase solo se usan como TIPOS de parámetros.
import type { Equipo } from '../../equipo/entities/equipo.entity';
import type { Escenario } from '../../escenario/entities/escenario.entity';
// FaseFinal y TipoFase SÍ se usan en tiempo de ejecución (instanceof y el valor del enum): import normal.
// Fase solo como tipo ("type" delante de ese nombre).
import { type Fase, FaseFinal } from '../../fase/entities/fase.entity';
import { TipoFase } from '../../fase/entities/tipo-fase.enum';
// Se reutilizan helpers de jugador (mismo dueño, B): no se copian.
import { EquipoResumenMapper } from '../../jugador/mappers/equipo-resumen.mapper';
import { aFechaHoraIso } from '../../common/utils/fechas';
import { CrearPartidoDto } from '../dto/crear-partido.dto';
import { PartidoResponseDto } from '../dto/partido-response.dto';
import { tieneResultado } from '../entities/estado-partido.enum';
import { Partido } from '../entities/partido.entity';

export class PartidoMapper {
  // DTO de entrada + entidades que el service YA buscó y validó → datos de la entidad.
  // El mapper no consulta la BD. El estado y los marcadores los pone el service (no vienen en el request).
  static aDatosEntidad(
    dto: CrearPartidoDto,
    fase: Fase,
    local: Equipo,
    visitante: Equipo,
    escenario: Escenario | null,
  ): Partial<Partido> {
    return {
      fase,
      equipoLocal: local,
      equipoVisitante: visitante,
      // Parseo explícito de yyyy-MM-ddTHH:mm:ss en componentes locales para evitar desfases con TZ.
      fechaHora: PartidoMapper.aFechaLocal(dto.fechaHora),
      escenario,
      ronda: dto.ronda ?? null, // si no vino, NULL (partido de grupo)
      numeroLlave: dto.numeroLlave ?? null,
    };
  }

  // Necesita el partido con sus relaciones cargadas: fase (con su torneo), equipoLocal,
  // equipoVisitante y escenario. cantidadAnotaciones la cuenta el service (el mapper no consulta la BD).
  static aResponse(
    partido: Partido,
    cantidadAnotaciones: number,
  ): PartidoResponseDto {
    const fase = partido.fase;
    const torneo = fase.torneo;
    return {
      id: partido.id,
      // TorneoResumen (5.6): id, nombre y estado.
      torneo: { id: torneo.id, nombre: torneo.nombre, estado: torneo.estado },
      // FaseResumen (5.6): "tipo" no es una propiedad de la entidad (lo maneja TypeORM), se deduce.
      fase: {
        id: fase.id,
        nombre: fase.nombre,
        tipo: PartidoMapper.tipoDeFase(fase),
        orden: fase.orden,
      },
      equipoLocal: EquipoResumenMapper.aResumen(partido.equipoLocal),
      equipoVisitante: EquipoResumenMapper.aResumen(partido.equipoVisitante),
      fechaHora: aFechaHoraIso(partido.fechaHora), // Date → "2026-12-05T15:30:00"
      // EscenarioResumen (5.6) o null: el escenario es opcional.
      escenario: partido.escenario
        ? { id: partido.escenario.id, nombre: partido.escenario.nombre }
        : null,
      ronda: partido.ronda ?? null, // el contrato siempre trae la clave, aunque sea null
      numeroLlave: partido.numeroLlave ?? null,
      estado: partido.estado,
      marcadorLocal: partido.marcadorLocal ?? null,
      marcadorVisitante: partido.marcadorVisitante ?? null,
      // La regla vive junto al enum (estado-partido.enum.ts); el mapper solo la copia a la respuesta.
      tieneResultado: tieneResultado(partido),
      cantidadAnotaciones,
    };
  }

  // Fase es abstracta (herencia en una sola tabla, 6.11): TypeORM entrega un Grupo o una FaseFinal.
  // "instanceof" pregunta de qué clase es el objeto; el mapper pone el "tipo" en la respuesta.
  static tipoDeFase(fase: Fase): TipoFase {
    if (fase instanceof FaseFinal) {
      return TipoFase.FINAL;
    }
    return TipoFase.GRUPO;
  }

  private static aFechaLocal(iso: string): Date {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/.exec(iso);
    if (!match) return new Date(iso);
    const [, y, m, d, h, min, s] = match.map(Number);
    return new Date(y, m - 1, d, h, min, s);
  }
}
