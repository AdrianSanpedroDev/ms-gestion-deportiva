// "import type": solo se usan como TIPOS. Al compilar a JavaScript estas líneas desaparecen.
// TODO: ajustar la ruta cuando A suba common/dto (los *Resumen de 5.6)
import type { EquipoResumen } from '../../common/dto/equipo-resumen.dto';
import type { JugadorResumen } from '../../common/dto/jugador-resumen.dto';

// AnotacionResponse (9.11), campo por campo. Los resúmenes evitan devolver las entidades completas.
export class AnotacionResponseDto {
  id!: number;
  partidoId!: number; // solo el id: el partido completo se consulta en GET /api/partidos/{id}
  jugador!: JugadorResumen; // { id, tipoDocumento, numeroDocumento, nombreCompleto, activo }
  // NO es una columna de anotacion (6.13): se deduce del contrato del jugador con el local o el visitante.
  // null solo si en la BD no queda ningún contrato del jugador con esos equipos (no debería pasar:
  // los contratos nunca se borran y al crear la anotación se exigió uno activo).
  equipo!: EquipoResumen | null;
  minuto!: number | null;
  valor!: number;
  descripcion!: string | null;
  fechaRegistro!: string; // "2026-12-05T16:05:00"
}
