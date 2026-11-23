// "import type": JugadorResumen solo se usa como TIPO (la línea desaparece al compilar).
import type { JugadorResumen } from '../../common/dto/jugador-resumen.dto';
import { CrearJugadorDto } from '../dto/crear-jugador.dto';
import { JugadorResponseDto } from '../dto/jugador-response.dto';
import { Jugador } from '../entities/jugador.entity';
import { aFechaHoraIso, hoyBogota } from '../../common/utils/fechas';

export class JugadorMapper {
  // DTO de entrada → datos de la entidad. Solo copia los 7 campos del JugadorRequest (9.7):
  // así un "id" o "activo" de más en el body nunca llega a la entidad, aunque fallara el whitelist.
  // Los opcionales que no vienen quedan en null: el PUT reemplaza el recurso completo.
  static aDatosEntidad(dto: CrearJugadorDto): Partial<Jugador> {
    return {
      tipoDocumento: dto.tipoDocumento,
      numeroDocumento: dto.numeroDocumento,
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      fechaNacimiento: dto.fechaNacimiento,
      email: dto.email ?? null,
      telefono: dto.telefono ?? null,
    };
  }

  static aResponse(jugador: Jugador): JugadorResponseDto {
    return {
      id: jugador.id,
      tipoDocumento: jugador.tipoDocumento,
      numeroDocumento: jugador.numeroDocumento,
      nombres: jugador.nombres,
      apellidos: jugador.apellidos,
      nombreCompleto: JugadorMapper.nombreCompleto(jugador),
      fechaNacimiento: jugador.fechaNacimiento,
      edad: JugadorMapper.calcularEdad(jugador.fechaNacimiento, hoyBogota()),
      email: jugador.email ?? null, // el contrato siempre trae la clave, aunque sea null
      telefono: jugador.telefono ?? null,
      activo: jugador.activo,
      fechaCreacion: aFechaHoraIso(jugador.fechaCreacion), // Date → "2026-11-20T10:00:00"
    };
  }

  // JugadorResumen (5.6): solo 5 campos, no el jugador completo. Lo usan otros mappers de B
  // (EquipoJugadorMapper; más adelante el de anotaciones) para no armarlo a mano en cada uno.
  static aResumen(jugador: Jugador): JugadorResumen {
    return {
      id: jugador.id,
      tipoDocumento: jugador.tipoDocumento,
      numeroDocumento: jugador.numeroDocumento,
      nombreCompleto: JugadorMapper.nombreCompleto(jugador),
      activo: jugador.activo,
    };
  }

  // Única fuente de "nombres apellidos": la usan aResponse, aResumen y los mensajes de error de los services.
  static nombreCompleto(jugador: Jugador): string {
    return `${jugador.nombres} ${jugador.apellidos}`;
  }

  static calcularEdad(fechaNacimiento: string, hoy: string): number {
    // Se separa el texto "yyyy-MM-dd" en números: sin new Date, no hay zona horaria que corra el día.
    const [anioNac, mesNac, diaNac] = fechaNacimiento.split('-').map(Number);
    const [anioHoy, mesHoy, diaHoy] = hoy.split('-').map(Number);
    let edad = anioHoy - anioNac;
    // Si este año todavía no llega su cumpleaños, aún no cumple esos años (si cumple hoy, ya cuentan).
    if (mesHoy < mesNac || (mesHoy === mesNac && diaHoy < diaNac)) {
      edad--;
    }
    return edad;
  }
}
