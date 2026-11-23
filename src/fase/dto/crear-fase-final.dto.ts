import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

// Cantidades de equipos válidas para una fase final (ACUERDOS 6.11).
// Fuente única compartida entre DTO y FaseFinalService.
export const CANTIDADES_EQUIPOS_FASE_FINAL = [2, 4, 8, 16, 32] as const;

export function esCantidadEquiposValida(cantidad: number): boolean {
  return (CANTIDADES_EQUIPOS_FASE_FINAL as readonly number[]).includes(
    cantidad,
  );
}

// Body de POST /api/torneos/{torneoId}/fase-final (HU-GC-05, ACUERDOS 6.11 y 9.16).
// Orden de decoradores: el más cercano a la propiedad gana primero en ValidationPipe (ACUERDOS 13.2).
export class CrearFaseFinalDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MaxLength(100, {
    message: 'El nombre de la fase final no puede superar los 100 caracteres',
  })
  @IsNotEmpty({ message: 'El nombre de la fase final es obligatorio' })
  @IsString({ message: 'El nombre de la fase final debe ser un texto' })
  nombre!: string;

  @Min(1, {
    message: 'El orden de la fase final debe ser mayor o igual a 1',
  })
  @IsInt({ message: 'El orden de la fase final debe ser un número entero' })
  orden!: number;

  @IsIn([...CANTIDADES_EQUIPOS_FASE_FINAL], {
    message:
      'La cantidad de equipos de la fase final debe ser 2, 4, 8, 16 o 32',
  })
  @IsInt({
    message:
      'La cantidad de equipos de la fase final debe ser un número entero',
  })
  cantidadEquipos!: number;

  // Opcional en la entrada; si no se envía, FaseFinalService guarda false (ACUERDOS 6.11).
  @IsOptional()
  @IsBoolean({
    message: 'El campo tercerPuesto debe ser un valor booleano',
  })
  tercerPuesto?: boolean;
}
