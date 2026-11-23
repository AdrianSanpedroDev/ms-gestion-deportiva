import { EstadoTorneo } from '../../torneo/entities/estado-torneo.enum';

export class TorneoResumenDto {
  id!: number;
  nombre!: string;
  estado!: EstadoTorneo;
}
export { TorneoResumenDto as TorneoResumen };
