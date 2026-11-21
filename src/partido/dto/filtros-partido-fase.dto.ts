import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { aTextoFiltro } from '../../jugador/dto/transformadores';
import { EstadoPartido } from '../entities/estado-partido.enum';
import { MENSAJE_ESTADO_PARTIDO } from './mensajes-partido';

// Filtro opcional de GET /api/fases/{faseId}/partidos?estado= (9.10). La fase ya viene en la URL.
// Es su propia clase (y no FiltrosPartidoDto) para que, con forbidNonWhitelisted,
// "?torneoId=" en esta ruta dé 400 en vez de ignorarse.
export class FiltrosPartidoFaseDto {
  // "?estado=" vacío → undefined = sin filtro; si viene, debe ser un valor del enum.
  // Tipo "EstadoPartido | undefined" (nunca null). El service solo pondrá "estado" en el where si vino:
  // en TypeORM 1.1.2 una clave del where con null o undefined lanza error.
  @IsOptional()
  @Transform(aTextoFiltro)
  @IsEnum(EstadoPartido, { message: MENSAJE_ESTADO_PARTIDO })
  estado?: EstadoPartido;
}
