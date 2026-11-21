import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { aEnteroOpcional } from '../../jugador/dto/transformadores';
import { FiltrosPartidoFaseDto } from './filtros-partido-fase.dto';

// Filtros opcionales de GET /api/partidos?torneoId=&equipoId=&estado= (9.10).
// extends FiltrosPartidoFaseDto → hereda "estado" con sus mismas validaciones (no se copia).
// Orden: gana el mensaje del decorador más cercano a la propiedad → @IsInt abajo, @Min arriba.
export class FiltrosPartidoDto extends FiltrosPartidoFaseDto {
  // En la URL todo llega como texto: "1" → 1. Vacío → sin filtro.
  @IsOptional()
  @Transform(aEnteroOpcional)
  @Min(1, { message: 'torneoId debe ser mayor o igual a 1' })
  @IsInt({ message: 'torneoId debe ser un número entero' })
  torneoId?: number;

  // Partidos donde el equipo juega de local O de visitante (el OR lo arma el service).
  @IsOptional()
  @Transform(aEnteroOpcional)
  @Min(1, { message: 'equipoId debe ser mayor o igual a 1' })
  @IsInt({ message: 'equipoId debe ser un número entero' })
  equipoId?: number;
}
