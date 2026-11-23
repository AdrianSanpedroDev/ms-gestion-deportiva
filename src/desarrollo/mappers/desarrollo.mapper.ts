// TODO: Equipo y Torneo son de A (ACUERDOS 6.2, 6.8 y 6.14); compilan cuando A suba sus entidades
import type { Equipo } from '../../equipo/entities/equipo.entity';
import type { FilaPosicionDto } from '../../fase/dto/fila-posicion.dto';
import type { RondaLlavesDto } from '../../fase/dto/llaves-response.dto';
import type { Fase, FaseFinal } from '../../fase/entities/fase.entity';
import { TipoFase } from '../../fase/entities/tipo-fase.enum';
import { FaseFinalMapper } from '../../fase/mappers/fase-final.mapper';
import { GrupoMapper } from '../../fase/mappers/grupo.mapper';
import type { Partido } from '../../partido/entities/partido.entity';
import type { Torneo } from '../../torneo/entities/torneo.entity';
import type {
  DesarrolloTorneoResponseDto,
  FaseDesarrolloDto,
  ResumenDesarrolloDto,
  TorneoDesarrolloDto,
} from '../dto/desarrollo-torneo-response.dto';

// Mapper puro de desarrollo del torneo (HU-GC-08, ACUERDOS 4.1 y 9.17).
// Transforma entidades y resultados ya calculados en DTOs sin reglas de negocio ni BD.
export class DesarrolloMapper {
  // Requiere torneo.deporte cargado.
  static aTorneoDesarrollo(
    torneo: Torneo,
    cantidadInscritos: number,
  ): TorneoDesarrolloDto {
    return {
      id: torneo.id,
      nombre: torneo.nombre,
      deporte: {
        id: torneo.deporte.id,
        nombre: torneo.deporte.nombre,
        activo: Boolean(torneo.deporte.activo),
      },
      fechaInicio: torneo.fechaInicio,
      fechaFin: torneo.fechaFin,
      estado: torneo.estado,
      cantidadInscritos,
    };
  }

  static aFaseGrupoDesarrollo(
    grupo: Fase,
    equipos: Equipo[],
    tablaPosiciones: FilaPosicionDto[],
    partidos: Partido[],
  ): FaseDesarrolloDto {
    return {
      id: grupo.id,
      nombre: grupo.nombre,
      tipo: TipoFase.GRUPO,
      orden: grupo.orden,
      equipos: GrupoMapper.ordenarEquipos(equipos).map((equipo) =>
        GrupoMapper.aEquipoResumen(equipo),
      ),
      tablaPosiciones,
      llaves: null,
      partidos: partidos.map((partido) =>
        FaseFinalMapper.aPartidoResumen(partido),
      ),
    };
  }

  static aFaseFinalDesarrollo(
    faseFinal: FaseFinal,
    llaves: RondaLlavesDto[],
    partidos: Partido[],
  ): FaseDesarrolloDto {
    return {
      id: faseFinal.id,
      nombre: faseFinal.nombre,
      tipo: TipoFase.FINAL,
      orden: faseFinal.orden,
      equipos: null,
      tablaPosiciones: null,
      llaves,
      partidos: partidos.map((partido) =>
        FaseFinalMapper.aPartidoResumen(partido),
      ),
    };
  }

  static aResponse(
    torneo: Torneo,
    cantidadInscritos: number,
    resumen: ResumenDesarrolloDto,
    fases: FaseDesarrolloDto[],
  ): DesarrolloTorneoResponseDto {
    return {
      torneo: DesarrolloMapper.aTorneoDesarrollo(torneo, cantidadInscritos),
      resumen,
      fases,
    };
  }
}
