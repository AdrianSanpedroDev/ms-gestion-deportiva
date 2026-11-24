import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

function aEnteroOpcional({ value }: { value: unknown }): unknown {
  if (value === undefined || value === null || value === '') return undefined;
  const numero = Number(value);
  return Number.isNaN(numero) ? value : numero;
}

// Query params de GET /api/torneos/{torneoId}/grupos?orden= (HU-GC-04, ACUERDOS 9.15).
export class FiltrosGrupoDto {
  @IsOptional()
  @Transform(aEnteroOpcional)
  @Min(1, { message: 'El orden del grupo debe ser mayor o igual a 1' })
  @IsInt({ message: 'El orden del grupo debe ser un número entero' })
  orden?: number;
}
