// TODO: verificar ruta cuando A suba common/dto/torneo-resumen.dto.ts (ACUERDOS 5.6 y 13.1)
import type { TorneoResumen } from '../../common/dto/torneo-resumen.dto';
import { TipoFase } from '../entities/tipo-fase.enum';

// Respuesta de los endpoints de fases (HU-GC-03 y HU-GC-05, ACUERDOS 9.14 y 9.16).
// En GRUPO: cantidadEquipos = conteo real en grupo_equipo y tercerPuesto = null.
// En FINAL: cantidadEquipos y tercerPuesto salen de FaseFinal.
export interface FaseResponseDto {
  id: number;
  torneo: TorneoResumen;
  nombre: string;
  tipo: TipoFase;
  orden: number;
  cantidadEquipos: number;
  tercerPuesto: boolean | null;
  cantidadPartidos: number;
}
