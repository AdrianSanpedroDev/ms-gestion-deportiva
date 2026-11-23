// TODO: verificar ruta cuando A suba common/dto/equipo-resumen.dto.ts (ACUERDOS 5.6 y 13.1)
import type { EquipoResumen } from '../../common/dto/equipo-resumen.dto';

// Fila de la tabla de posiciones de un grupo (HU-GC-04 y HU-GC-08, ACUERDOS 9.15 y 9.17).
export interface FilaPosicionDto {
  posicion: number;
  equipo: EquipoResumen;
  jugados: number;
  ganados: number;
  empatados: number;
  perdidos: number;
  aFavor: number;
  enContra: number;
  diferencia: number;
  puntos: number;
}
