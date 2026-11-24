import { aFechaHoraIso } from '../../common/utils/fechas';
import { InscripcionResponseDto } from '../dto/inscripcion-response.dto';
import { Inscripcion } from '../entities/inscripcion.entity';

export class InscripcionMapper {
  static aResponse(inscripcion: Inscripcion): InscripcionResponseDto {
    return {
      id: inscripcion.id,
      torneo: {
        id: inscripcion.torneo.id,
        nombre: inscripcion.torneo.nombre,
        estado: inscripcion.torneo.estado,
      },
      equipo: {
        id: inscripcion.equipo.id,
        nombre: inscripcion.equipo.nombre,
        activo: inscripcion.equipo.activo,
      },
      fechaInscripcion: aFechaHoraIso(inscripcion.fechaInscripcion),
    };
  }
}
