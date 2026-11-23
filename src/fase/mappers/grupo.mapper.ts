// TODO: verificar ruta cuando A suba common/dto/equipo-resumen.dto.ts (ACUERDOS 5.6 y 13.1)
import type { EquipoResumen } from '../../common/dto/equipo-resumen.dto';
// TODO: Equipo es de A (ACUERDOS 6.2 y 6.14); compila cuando A suba equipo/entities/equipo.entity.ts
import type { Equipo } from '../../equipo/entities/equipo.entity';
import { EquipoResumenMapper } from '../../jugador/mappers/equipo-resumen.mapper';
import type { GrupoResponseDto } from '../dto/grupo-response.dto';
import type { Grupo } from '../entities/fase.entity';

// Mapper puro de grupos (ACUERDOS 4.1 y 9.15): transforma entidades en DTOs sin reglas de negocio ni BD.
export class GrupoMapper {
  static aEquipoResumen(equipo: Equipo): EquipoResumen {
    return EquipoResumenMapper.aResumen(equipo);
  }

  static ordenarEquipos(equipos: Equipo[]): Equipo[] {
    return [...equipos].sort((a, b) => {
      const porNombre = a.nombre.localeCompare(b.nombre, 'es', {
        sensitivity: 'base',
      });
      return porNombre !== 0 ? porNombre : a.id - b.id;
    });
  }

  // Requiere grupo.torneo cargado.
  static aResponse(grupo: Grupo, equipos: Equipo[]): GrupoResponseDto {
    return {
      id: grupo.id,
      torneo: {
        id: grupo.torneo.id,
        nombre: grupo.torneo.nombre,
        estado: grupo.torneo.estado,
      },
      nombre: grupo.nombre,
      orden: grupo.orden,
      equipos: GrupoMapper.ordenarEquipos(equipos).map((equipo) =>
        GrupoMapper.aEquipoResumen(equipo),
      ),
    };
  }
}
