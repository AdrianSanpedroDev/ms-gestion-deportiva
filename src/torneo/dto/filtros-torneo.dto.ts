import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { EstadoTorneo } from '../entities/estado-torneo.enum';

function aEnteroOpcional({ value }: { value: unknown }): unknown {
  if (value === undefined || value === null || value === '') return undefined;
  const numero = Number(value);
  return Number.isNaN(numero) ? value : numero;
}

function aCadenaOpcional({ value }: { value: unknown }): unknown {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return typeof value === 'string' ? value.trim() : value;
}

export class FiltrosTorneoDto {
  @IsOptional()
  @Transform(aCadenaOpcional)
  @IsString({ message: 'El filtro nombre debe ser texto' })
  nombre?: string;

  @IsOptional()
  @Transform(aEnteroOpcional)
  @Min(1, { message: 'El filtro deporteId debe ser un entero positivo' })
  @IsInt({ message: 'El filtro deporteId debe ser un número entero' })
  deporteId?: number;

  @IsOptional()
  @Transform(aCadenaOpcional)
  @IsEnum(EstadoTorneo, {
    message: 'El filtro estado no corresponde a un estado válido de torneo',
  })
  estado?: EstadoTorneo;
}
