// TODO: verificar rutas cuando A suba common/dto/*-resumen.dto.ts (ACUERDOS 5.6 y 13.1)
import type { EquipoResumen } from '../../common/dto/equipo-resumen.dto';
import type { FaseResumen } from '../../common/dto/fase-resumen.dto';
import type { PartidoResumen } from '../../common/dto/partido-resumen.dto';
import { RondaFinal } from '../entities/ronda-final.enum';

// Una llave individual dentro de una ronda de la fase final (HU-GC-05 y HU-GC-08, ACUERDOS 9.16 y 9.17).
export interface LlaveDto {
  numeroLlave: number;
  partido: PartidoResumen | null;
  ganador: EquipoResumen | null;
}

// Agrupación de llaves por ronda en orden de avance (HU-GC-05 y HU-GC-08, ACUERDOS 6.11, 9.16 y 9.17).
export interface RondaLlavesDto {
  ronda: RondaFinal;
  llaves: LlaveDto[];
}

// Respuesta de GET /api/fases-finales/{id}/llaves (HU-GC-05, ACUERDOS 9.16).
export interface LlavesResponseDto {
  fase: FaseResumen;
  cantidadEquipos: number;
  tercerPuesto: boolean;
  rondas: RondaLlavesDto[];
}
