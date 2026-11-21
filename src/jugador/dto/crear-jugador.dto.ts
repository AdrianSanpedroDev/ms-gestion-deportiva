import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { TipoDocumento } from '../entities/tipo-documento.enum';
import { recortar, recortarOpcional } from './transformadores';

// JugadorRequest (sección 9.7).
// Orden de los decoradores: se aplican de ABAJO hacia ARRIBA, y el filtro de A muestra el primer mensaje,
// que es el del decorador más cercano a la propiedad. Por eso @IsNotEmpty va pegado a la propiedad,
// encima el tipo o formato y arriba del todo el largo o la validez de la fecha.
export class CrearJugadorDto {
  @IsEnum(TipoDocumento, {
    message: 'El tipo de documento debe ser CC, TI, CE o PASAPORTE',
  })
  @IsNotEmpty({ message: 'El tipo de documento es obligatorio' })
  tipoDocumento!: TipoDocumento;

  @Transform(recortar)
  @MaxLength(20, {
    message: 'El número de documento admite máximo 20 caracteres',
  })
  @IsString({ message: 'El número de documento debe ser texto' })
  @IsNotEmpty({ message: 'El número de documento es obligatorio' })
  numeroDocumento!: string;

  @Transform(recortar)
  @MaxLength(100, { message: 'Los nombres admiten máximo 100 caracteres' })
  @IsString({ message: 'Los nombres deben ser texto' })
  @IsNotEmpty({ message: 'Los nombres son obligatorios' })
  nombres!: string;

  @Transform(recortar)
  @MaxLength(100, { message: 'Los apellidos admiten máximo 100 caracteres' })
  @IsString({ message: 'Los apellidos deben ser texto' })
  @IsNotEmpty({ message: 'Los apellidos son obligatorios' })
  apellidos!: string;

  @IsDateString(
    { strict: true },
    { message: 'La fecha de nacimiento no es una fecha válida' },
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha de nacimiento debe tener formato yyyy-MM-dd',
  })
  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria' })
  fechaNacimiento!: string;

  // Opcionales: "" o "   " se convierten en null (sin dato) antes de validar.
  @Transform(recortarOpcional)
  @IsOptional()
  @MaxLength(150, { message: 'El email admite máximo 150 caracteres' })
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  email?: string | null;

  @Transform(recortarOpcional)
  @IsOptional()
  @MaxLength(20, { message: 'El teléfono admite máximo 20 caracteres' })
  @IsString({ message: 'El teléfono debe ser texto' })
  telefono?: string | null;
}
