import { CrearJugadorDto } from '../dto/crear-jugador.dto';
import { JugadorResponseDto } from '../dto/jugador-response.dto';
import { Jugador } from '../entities/jugador.entity';

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
    const hoy = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/Bogota',
    }); // "yyyy-MM-dd"
    return {
      id: jugador.id,
      tipoDocumento: jugador.tipoDocumento,
      numeroDocumento: jugador.numeroDocumento,
      nombres: jugador.nombres,
      apellidos: jugador.apellidos,
      nombreCompleto: `${jugador.nombres} ${jugador.apellidos}`,
      fechaNacimiento: jugador.fechaNacimiento,
      edad: JugadorMapper.calcularEdad(jugador.fechaNacimiento, hoy),
      email: jugador.email ?? null, // el contrato siempre trae la clave, aunque sea null
      telefono: jugador.telefono ?? null,
      activo: jugador.activo,
      fechaCreacion: jugador.fechaCreacion.replace(' ', 'T'), // TODO: cambiar por aFechaHoraIso() de common/utils cuando A lo suba
    };
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
