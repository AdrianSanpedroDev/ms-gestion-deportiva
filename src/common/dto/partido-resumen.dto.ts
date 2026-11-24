import type { EstadoPartido } from '../../partido/entities/estado-partido.enum';
import type { RondaFinal } from '../../fase/entities/ronda-final.enum';
import type { EquipoResumen } from './equipo-resumen.dto';

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
