import { CrearHabilidadDto } from '../dto/crear-habilidad.dto';
import { HabilidadResponseDto } from '../dto/habilidad-response.dto';
import { Habilidad } from '../entities/habilidad.entity';
// Se reutiliza el helper de jugador (mismo dueño, B): no se copia.
import { aFechaHoraIso } from '../../jugador/utils/fechas';

export class HabilidadMapper {
  // DTO de entrada → datos de la entidad. Solo copia los 3 campos del HabilidadRequest (9.9):
  // un "id" o "fechaCreacion" de más en el body nunca llega a la entidad.
  // Si no viene descripción queda null: el PUT reemplaza el recurso completo.
  static aDatosEntidad(dto: CrearHabilidadDto): Partial<Habilidad> {
    return {
      nombre: dto.nombre,
      descripcion: dto.descripcion ?? null,
      categoria: dto.categoria,
    };
  }

  static aResponse(habilidad: Habilidad): HabilidadResponseDto {
    return {
      id: habilidad.id,
      nombre: habilidad.nombre,
      descripcion: habilidad.descripcion ?? null, // el contrato siempre trae la clave, aunque sea null
      categoria: habilidad.categoria,
      fechaCreacion: aFechaHoraIso(habilidad.fechaCreacion), // Date → "2026-11-20T10:00:00"
    };
  }
}
