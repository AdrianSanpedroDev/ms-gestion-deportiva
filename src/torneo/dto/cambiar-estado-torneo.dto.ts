import { IsEnum } from 'class-validator';
import { EstadoTorneo } from '../entities/estado-torneo.enum';

export class CambiarEstadoTorneoDto {
  @IsEnum(EstadoTorneo, { message: 'El estado no es válido' })
  estado!: EstadoTorneo;
}
