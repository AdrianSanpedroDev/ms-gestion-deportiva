// "import type": Equipo, Jugador y Partido solo se usan como TIPOS de parámetros (la línea desaparece
// al compilar): el mapper no crea ni consulta esas entidades, solo recibe objetos ya cargados.
import type { Equipo } from '../../equipo/entities/equipo.entity';
import type { Jugador } from '../../jugador/entities/jugador.entity';
// Se reutilizan los mappers y helpers de jugador (mismo dueño, B): no se arman los resúmenes a mano.
import { EquipoResumenMapper } from '../../jugador/mappers/equipo-resumen.mapper';
import { JugadorMapper } from '../../jugador/mappers/jugador.mapper';
import { aFechaHoraIso } from '../../common/utils/fechas';
import { AnotacionResponseDto } from '../dto/anotacion-response.dto';
import { CrearAnotacionDto } from '../dto/crear-anotacion.dto';
import { Anotacion } from '../entities/anotacion.entity';
import type { Partido } from '../entities/partido.entity';

export class AnotacionMapper {
  // DTO de entrada + entidades que el service YA buscó y validó → datos de la entidad.
  // Solo copia los 4 campos del AnotacionRequest (9.11); el partido y el jugador llegan ya buscados.
  // Los opcionales que no vienen: minuto y descripcion en null, valor en 1 (default de 6.13).
  static aDatosEntidad(
    dto: CrearAnotacionDto,
    partido: Partido,
    jugador: Jugador,
  ): Partial<Anotacion> {
    return {
      partido,
      jugador,
      minuto: dto.minuto ?? null,
      valor: dto.valor ?? 1,
      descripcion: dto.descripcion ?? null,
    };
  }

  // Necesita la anotación con partido y jugador cargados. El equipo NO es una columna de anotacion:
  // lo deduce el service (contrato del jugador con el local o el visitante) y llega como parámetro,
  // porque el mapper no consulta la BD (igual que cantidadAnotaciones en PartidoMapper).
  static aResponse(
    anotacion: Anotacion,
    equipo: Equipo | null,
  ): AnotacionResponseDto {
    return {
      id: anotacion.id,
      partidoId: anotacion.partido.id,
      jugador: JugadorMapper.aResumen(anotacion.jugador),
      equipo: equipo ? EquipoResumenMapper.aResumen(equipo) : null,
      minuto: anotacion.minuto ?? null, // el contrato siempre trae la clave, aunque sea null
      valor: anotacion.valor,
      descripcion: anotacion.descripcion ?? null,
      fechaRegistro: aFechaHoraIso(anotacion.fechaRegistro), // Date → "2026-12-05T16:05:00"
    };
  }
}
