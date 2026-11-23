import { aFechaHoraIso } from '../../common/utils/fechas';
import { CrearEquipoDto } from '../dto/crear-equipo.dto';
import { EquipoResponseDto } from '../dto/equipo-response.dto';
import { Equipo } from '../entities/equipo.entity';

export class EquipoMapper {
  static aDatosEntidad(dto: CrearEquipoDto): Partial<Equipo> {
    return {
      nombre: dto.nombre.trim(),
      ciudad: dto.ciudad.trim(),
      fechaFundacion: dto.fechaFundacion ?? null,
      descripcion: dto.descripcion?.trim() ?? null,
    };
  }
  static aResponse(equipo: Equipo): EquipoResponseDto {
    return {
      id: equipo.id, nombre: equipo.nombre, ciudad: equipo.ciudad,
      fechaFundacion: equipo.fechaFundacion, descripcion: equipo.descripcion,
      activo: equipo.activo, fechaCreacion: aFechaHoraIso(equipo.fechaCreacion),
    };
  }
}
