import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

// Query params de GET /api/torneos/{torneoId}/grupos?orden= (HU-GC-04, ACUERDOS 9.15).
export class FiltrosGrupoDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1, { message: 'El orden del grupo debe ser mayor o igual a 1' })
  @IsInt({ message: 'El orden del grupo debe ser un número entero' })
  orden?: number;
}
