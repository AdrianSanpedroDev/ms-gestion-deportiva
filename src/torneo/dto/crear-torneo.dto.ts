import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const FORMATO_FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

export class CrearTorneoDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MaxLength(150, { message: 'El nombre no puede superar 150 caracteres' })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre!: string;

  @Min(1, { message: 'El deporte debe ser un identificador entero positivo' })
  @IsInt({ message: 'El deporte debe ser un identificador entero' })
  @IsNotEmpty({ message: 'El deporte es obligatorio' })
  deporteId!: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MaxLength(500, {
    message: 'La descripción no puede superar 500 caracteres',
  })
  @IsString({ message: 'La descripción debe ser texto' })
  descripcion?: string;

  @IsDateString(
    { strict: true },
    { message: 'La fecha de inicio debe tener formato yyyy-MM-dd' },
  )
  @Matches(FORMATO_FECHA_ISO, {
    message: 'La fecha de inicio debe tener formato yyyy-MM-dd',
  })
  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria' })
  fechaInicio!: string;

  @IsDateString(
    { strict: true },
    { message: 'La fecha fin debe tener formato yyyy-MM-dd' },
  )
  @Matches(FORMATO_FECHA_ISO, {
    message: 'La fecha fin debe tener formato yyyy-MM-dd',
  })
  @IsNotEmpty({ message: 'La fecha fin es obligatoria' })
  fechaFin!: string;

  @IsDateString(
    { strict: true },
    { message: 'La fecha de cierre debe tener formato yyyy-MM-dd' },
  )
  @Matches(FORMATO_FECHA_ISO, {
    message: 'La fecha de cierre debe tener formato yyyy-MM-dd',
  })
  @IsNotEmpty({ message: 'La fecha de cierre de inscripciones es obligatoria' })
  fechaCierreInscripciones!: string;

  @IsOptional()
  @Min(2, { message: 'El máximo de equipos debe ser al menos 2' })
  @IsInt({ message: 'El máximo de equipos debe ser un número entero' })
  maxEquipos?: number;
}
