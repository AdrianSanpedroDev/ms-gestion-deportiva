import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

// Body de PATCH /api/fases/{id} (HU-GC-03, ACUERDOS 9.14).
// Permite actualizar nombre, orden o ambos. Solo valida FORMA; las reglas de negocio van en FaseService.
// Orden de decoradores: el más cercano a la propiedad gana primero en ValidationPipe (ACUERDOS 13.2).
export class ActualizarFaseDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MaxLength(100, {
    message: 'El nombre de la fase no puede superar los 100 caracteres',
  })
  @IsString({ message: 'El nombre de la fase debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre de la fase no puede estar vacío' })
  nombre?: string;

  @IsOptional()
  @Min(1, { message: 'El orden de la fase debe ser mayor o igual a 1' })
  @IsInt({ message: 'El orden de la fase debe ser un número entero' })
  orden?: number;
}
