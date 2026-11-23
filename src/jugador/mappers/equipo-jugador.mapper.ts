import { ContratoResponseDto } from '../dto/contrato-response.dto';
import { CrearContratoDto } from '../dto/crear-contrato.dto';
// Aquí Equipo solo se usa como TIPO del parámetro → "import type" (desaparece al compilar).
import type { Equipo } from '../../equipo/entities/equipo.entity';
import { EquipoJugador } from '../entities/equipo-jugador.entity';
import { Jugador } from '../entities/jugador.entity';
import { EquipoResumenMapper } from './equipo-resumen.mapper';
import { JugadorMapper } from './jugador.mapper';

export class EquipoJugadorMapper {
  // DTO de entrada + entidades ya validadas por el service → datos del contrato nuevo.
  // El mapper no consulta la BD: recibe el equipo y el jugador que el service ya buscó.
  static aDatosEntidad(
    dto: CrearContratoDto,
    equipo: Equipo,
    jugador: Jugador,
  ): Partial<EquipoJugador> {
    return {
      equipo,
      jugador,
      fechaInicio: dto.fechaInicio,
      fechaFin: dto.fechaFin,
      fechaRetiro: null, // un contrato nuevo no tiene retiro
      activo: true, // y nace activo
    };
  }

  // Necesita que el contrato venga con sus relaciones cargadas (relations: { equipo: true, jugador: true }).
  static aResponse(contrato: EquipoJugador): ContratoResponseDto {
    return {
      id: contrato.id,
      // JugadorResumen (5.6): se reutiliza el de JugadorMapper, no se arma a mano aquí.
      jugador: JugadorMapper.aResumen(contrato.jugador),
      // EquipoResumen (5.6): id, nombre y activo, armado en un solo lugar.
      equipo: EquipoResumenMapper.aResumen(contrato.equipo),
      fechaInicio: contrato.fechaInicio,
      fechaFin: contrato.fechaFin,
      fechaRetiro: contrato.fechaRetiro ?? null, // el contrato siempre trae la clave, aunque sea null
      activo: contrato.activo,
    };
  }
}
