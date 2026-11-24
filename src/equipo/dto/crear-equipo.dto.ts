import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const FORMATO_FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

export class CrearEquipoDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres' })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MaxLength(100, { message: 'La ciudad no puede superar 100 caracteres' })
  @IsString({ message: 'La ciudad debe ser texto' })
  @IsNotEmpty({ message: 'La ciudad es obligatoria' })
  ciudad!: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === ''
      ? undefined
      : typeof value === 'string'
        ? value.trim()
        : value,
  )
  @IsDateString(
    { strict: true },
    { message: 'La fecha de fundación debe tener formato yyyy-MM-dd' },
  )
  @Matches(FORMATO_FECHA_ISO, {
    message: 'La fecha de fundación debe tener formato yyyy-MM-dd',
  })
  fechaFundacion?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MaxLength(500, {
    message: 'La descripción no puede superar 500 caracteres',
  })
  @IsString({ message: 'La descripción debe ser texto' })
  descripcion?: string;
}
