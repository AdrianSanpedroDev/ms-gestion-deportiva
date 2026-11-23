import type { EquipoResumen } from '../../common/dto/equipo-resumen.dto';
import type { EstadoPartido } from '../../partido/entities/estado-partido.enum';
import type { RondaFinal } from '../entities/ronda-final.enum';

// PartidoResumen (ACUERDOS 5.6): definido en carpeta de Persona C mientras no exista en common/dto/.
export interface PartidoResumen {
  id: number;
  equipoLocal: EquipoResumen;
  equipoVisitante: EquipoResumen;
  fechaHora: string;
  estado: EstadoPartido;
  marcadorLocal: number | null;
  marcadorVisitante: number | null;
  tieneResultado: boolean;
  ronda: RondaFinal | null;
  numeroLlave: number | null;
}
