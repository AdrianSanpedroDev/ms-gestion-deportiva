// "import type": solo se usan como TIPOS. Al compilar a JavaScript estas líneas desaparecen.
import type { EquipoResumen } from '../../common/dto/equipo-resumen.dto';
import type { EscenarioResumen } from '../../common/dto/escenario-resumen.dto';
import type { FaseResumen } from '../../common/dto/fase-resumen.dto';
import type { TorneoResumen } from '../../common/dto/torneo-resumen.dto';
import type { RondaFinal } from '../../fase/entities/ronda-final.enum';
import { EstadoPartido } from '../entities/estado-partido.enum';

// PartidoResponse (9.10), campo por campo. Los resúmenes evitan devolver las entidades
// Torneo, Fase, Equipo y Escenario completas (son de A y C).
export class PartidoResponseDto {
  id!: number;
  torneo!: TorneoResumen; // { id, nombre, estado }
  fase!: FaseResumen; // { id, nombre, tipo, orden }
  equipoLocal!: EquipoResumen; // { id, nombre, activo }
  equipoVisitante!: EquipoResumen;
  fechaHora!: string; // "2026-12-05T15:30:00"
  escenario!: EscenarioResumen | null; // { id, nombre } o null si no tiene
  ronda!: RondaFinal | null;
  numeroLlave!: number | null;
  estado!: EstadoPartido;
  marcadorLocal!: number | null;
  marcadorVisitante!: number | null;
  tieneResultado!: boolean; // true si los dos marcadores no son null (5.6)
  cantidadAnotaciones!: number;
}
