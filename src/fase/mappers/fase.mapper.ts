// TODO: verificar ruta cuando A suba common/dto/fase-resumen.dto.ts (ACUERDOS 5.6 y 13.1)
import type { FaseResumen } from '../../common/dto/fase-resumen.dto';
import { FaseResponseDto } from '../dto/fase-response.dto';
import { type Fase, FaseFinal } from '../entities/fase.entity';
import { TipoFase } from '../entities/tipo-fase.enum';

// Mapper puro de fase/ (ACUERDOS 4.1 y 9.14): transforma entidades en DTOs sin reglas de negocio ni BD.
export class FaseMapper {
  static tipoDeFase(fase: Fase): TipoFase {
    if (fase instanceof FaseFinal) {
      return TipoFase.FINAL;
    }
    return TipoFase.GRUPO;
  }

  static aResumen(fase: Fase): FaseResumen {
    return {
      id: fase.id,
      nombre: fase.nombre,
      tipo: FaseMapper.tipoDeFase(fase),
      orden: fase.orden,
    };
  }

  // Requiere fase.torneo cargado. Los conteos los provee FaseService.
  static aResponse(
    fase: Fase,
    cantidadPartidos: number,
    cantidadEquiposGrupo = 0,
  ): FaseResponseDto {
    const esFinal = fase instanceof FaseFinal;
    return {
      id: fase.id,
      torneo: {
        id: fase.torneo.id,
        nombre: fase.torneo.nombre,
        estado: fase.torneo.estado,
      },
      nombre: fase.nombre,
      tipo: esFinal ? TipoFase.FINAL : TipoFase.GRUPO,
      orden: fase.orden,
      cantidadEquipos: esFinal ? fase.cantidadEquipos : cantidadEquiposGrupo,
      tercerPuesto: esFinal ? Boolean(fase.tercerPuesto) : null,
      cantidadPartidos,
    };
  }
}
