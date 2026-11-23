// TODO: verificar rutas cuando A suba common/dto (ACUERDOS 5.6 y 13.1)
import type { EquipoResumen } from '../../common/dto/equipo-resumen.dto';
import type { TorneoResumen } from '../../common/dto/torneo-resumen.dto';

// Respuesta de los endpoints de grupos (HU-GC-04, ACUERDOS 9.15).
export interface GrupoResponseDto {
  id: number;
  torneo: TorneoResumen;
  nombre: string;
  orden: number;
  equipos: EquipoResumen[];
}
