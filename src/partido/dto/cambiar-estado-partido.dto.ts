import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { recortar } from '../../jugador/dto/transformadores';
import { EstadoPartido } from '../entities/estado-partido.enum';
import { MENSAJE_ESTADO_PARTIDO } from './mensajes-partido';

// Body de PATCH /api/partidos/{id}/estado (9.10): { "estado": "EN_JUEGO" }.
// El DTO solo revisa que sea UNO de los 4 estados. Si la transición está permitida
// (PROGRAMADO → FINALIZADO no) lo decide el service con puedeCambiarEstado.
// Orden: gana el mensaje del decorador más cercano a la propiedad → @IsNotEmpty abajo.
export class CambiarEstadoPartidoDto {
  @Transform(recortar) // " EN_JUEGO " → "EN_JUEGO", mismo criterio que en los filtros
  @IsEnum(EstadoPartido, { message: MENSAJE_ESTADO_PARTIDO })
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  estado!: EstadoPartido;
}
