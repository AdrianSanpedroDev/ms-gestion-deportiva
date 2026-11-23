import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

// Body de POST /api/torneos/{torneoId}/grupos (HU-GC-04, ACUERDOS 9.15).
// Orden de decoradores: el más cercano a la propiedad gana primero en ValidationPipe (ACUERDOS 13.2).
export class CrearGrupoDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MaxLength(100, {
    message: 'El nombre del grupo no puede superar los 100 caracteres',
  })
  @IsNotEmpty({ message: 'El nombre del grupo es obligatorio' })
  @IsString({ message: 'El nombre del grupo debe ser un texto' })
  nombre!: string;

  @Min(1, { message: 'El orden del grupo debe ser mayor o igual a 1' })
  @IsInt({ message: 'El orden del grupo debe ser un número entero' })
  orden!: number;
}
