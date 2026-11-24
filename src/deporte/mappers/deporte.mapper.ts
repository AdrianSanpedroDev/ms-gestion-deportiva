import { DeporteResumenDto } from '../../common/dto/deporte-resumen.dto';
import { aFechaHoraIso } from '../../common/utils/fechas';
import { CrearDeporteDto } from '../dto/crear-deporte.dto';
import { DeporteResponseDto } from '../dto/deporte-response.dto';
import { Deporte } from '../entities/deporte.entity';

export class DeporteMapper {
  static aResumen(deporte: Deporte): DeporteResumenDto {
    return { id: deporte.id, nombre: deporte.nombre, activo: deporte.activo };
  }

  static aDatosEntidad(dto: CrearDeporteDto): Partial<Deporte> {
    return {
      nombre: dto.nombre.trim(),
      descripcion: dto.descripcion?.trim() || null,
    };
  }

  static aResponse(deporte: Deporte): DeporteResponseDto {
    const subdeportesOrdenados = [...(deporte.subdeportes ?? [])].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es'),
    );
    return {
      id: deporte.id,
      nombre: deporte.nombre,
      descripcion: deporte.descripcion,
      activo: deporte.activo,
      deportePadre: deporte.deportePadre
        ? this.aResumen(deporte.deportePadre)
        : null,
      subdeportes: subdeportesOrdenados.map((sub) => this.aResumen(sub)),
      fechaCreacion: aFechaHoraIso(deporte.fechaCreacion),
    };
  }
}
