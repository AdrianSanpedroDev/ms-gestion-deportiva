import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { EstadoTorneo } from '../entities/estado-torneo.enum';

export class FiltrosTorneoDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() deporteId?: number;
  @IsOptional() @IsEnum(EstadoTorneo) estado?: EstadoTorneo;
}
