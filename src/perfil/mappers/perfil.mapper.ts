import { Habilidad } from '../../habilidad/entities/habilidad.entity';
import type { HabilidadResumen } from '../../habilidad-jugador/dto/habilidad-resumen.dto';
import { HabilidadJugador } from '../../habilidad-jugador/entities/habilidad-jugador.entity';
import { EquipoJugador } from '../../jugador/entities/equipo-jugador.entity';
import { Jugador } from '../../jugador/entities/jugador.entity';
import { EquipoResumenMapper } from '../../jugador/mappers/equipo-resumen.mapper';
import { JugadorMapper } from '../../jugador/mappers/jugador.mapper';
import {
  EquipoActualPerfilDto,
  HistorialEquipoPerfilDto,
  JugadorPerfilDto,
  PerfilJugadorResponseDto,
} from '../dto/perfil-jugador-response.dto';

export class PerfilMapper {
  static readonly MENSAJE_SIN_EQUIPOS = 'El jugador no tiene equipos asociados';
  static readonly MENSAJE_SIN_HABILIDADES =
    'El jugador no tiene habilidades registradas';

  static aJugadorPerfil(jugador: Jugador, hoy: string): JugadorPerfilDto {
    return {
      id: jugador.id,
      tipoDocumento: jugador.tipoDocumento,
      numeroDocumento: jugador.numeroDocumento,
      nombreCompleto: JugadorMapper.nombreCompleto(jugador),
      fechaNacimiento: jugador.fechaNacimiento,
      edad: JugadorMapper.calcularEdad(jugador.fechaNacimiento, hoy),
      email: jugador.email ?? null,
      telefono: jugador.telefono ?? null,
      activo: jugador.activo,
    };
  }

  static aEquipoActual(contrato: EquipoJugador): EquipoActualPerfilDto {
    return {
      equipo: EquipoResumenMapper.aResumen(contrato.equipo),
      fechaInicio: contrato.fechaInicio,
      fechaFin: contrato.fechaFin,
    };
  }

  static aHistorialEquipo(contrato: EquipoJugador): HistorialEquipoPerfilDto {
    return {
      equipo: EquipoResumenMapper.aResumen(contrato.equipo),
      fechaInicio: contrato.fechaInicio,
      fechaFin: contrato.fechaFin,
      fechaRetiro: contrato.fechaRetiro ?? null,
    };
  }

  static aHabilidadResumen(habilidad: Habilidad): HabilidadResumen {
    return {
      id: habilidad.id,
      nombre: habilidad.nombre,
      categoria: habilidad.categoria,
    };
  }

  static aResponse(
    jugador: Jugador,
    contratos: EquipoJugador[],
    asignacionesHabilidad: HabilidadJugador[],
    hoy: string,
  ): PerfilJugadorResponseDto {
    const equiposActuales = contratos
      .filter((contrato) => contrato.activo)
      .map((contrato) => PerfilMapper.aEquipoActual(contrato));

    const historialEquipos = contratos
      .filter((contrato) => !contrato.activo)
      .map((contrato) => PerfilMapper.aHistorialEquipo(contrato));

    const habilidades = asignacionesHabilidad.map((asignacion) =>
      PerfilMapper.aHabilidadResumen(asignacion.habilidad),
    );

    // ACUERDOS 9.13: tieneEquipos evalúa si tiene equipos activos; igual mensajes exactos.
    const tieneEquipos = equiposActuales.length > 0;
    const tieneHabilidades = habilidades.length > 0;
    const mensajes: string[] = [];

    if (!tieneEquipos) {
      mensajes.push(PerfilMapper.MENSAJE_SIN_EQUIPOS);
    }
    if (!tieneHabilidades) {
      mensajes.push(PerfilMapper.MENSAJE_SIN_HABILIDADES);
    }

    return {
      jugador: PerfilMapper.aJugadorPerfil(jugador, hoy),
      equiposActuales,
      historialEquipos,
      habilidades,
      tieneEquipos,
      tieneHabilidades,
      mensajes,
    };
  }
}
