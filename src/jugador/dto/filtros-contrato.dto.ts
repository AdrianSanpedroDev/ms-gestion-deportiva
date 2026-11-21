import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { aBooleanoOpcional } from './transformadores';

// Filtro opcional de GET /api/equipos/{equipoId}/jugadores y GET /api/jugadores/{jugadorId}/equipos (9.8).
// Si no viene (o viene vacío), el service devuelve solo los contratos activos.
export class FiltrosContratoDto {
  // "true" → true, "false" → false, "" → undefined (sin filtro). El mismo helper que activo en FiltrosJugadorDto.
  @IsOptional()
  @Transform(aBooleanoOpcional)
  @IsBoolean({ message: 'incluirHistorial debe ser true o false' })
  incluirHistorial?: boolean;
}
