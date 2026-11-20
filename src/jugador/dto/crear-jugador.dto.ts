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

export class CrearJugadorDto {
  @IsNotEmpty({ message: 'El tipo de documento es obligatorio' })
  @IsEnum(TipoDocumento, {
    message: 'El tipo de documento debe ser CC, TI, CE o PASAPORTE',
  })
  tipoDocumento!: TipoDocumento;

  @Transform(recortar)
  @IsString({ message: 'El número de documento debe ser texto' })
  @IsNotEmpty({ message: 'El número de documento es obligatorio' })
  @MaxLength(20, {
    message: 'El número de documento admite máximo 20 caracteres',
  })
  numeroDocumento!: string;

  @Transform(recortar)
  @IsString({ message: 'Los nombres deben ser texto' })
  @IsNotEmpty({ message: 'Los nombres son obligatorios' })
  @MaxLength(100, { message: 'Los nombres admiten máximo 100 caracteres' })
  nombres!: string;

  @Transform(recortar)
  @IsString({ message: 'Los apellidos deben ser texto' })
  @IsNotEmpty({ message: 'Los apellidos son obligatorios' })
  @MaxLength(100, { message: 'Los apellidos admiten máximo 100 caracteres' })
  apellidos!: string;

  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha de nacimiento debe tener formato yyyy-MM-dd',
  })
  @IsDateString(
    { strict: true },
    { message: 'La fecha de nacimiento no es una fecha válida' },
  )
  fechaNacimiento!: string;

  // Opcionales: "" o "   " se convierten en null (sin dato) antes de validar.
  @Transform(recortarOpcional)
  @IsOptional()
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  @MaxLength(150, { message: 'El email admite máximo 150 caracteres' })
  email?: string | null;

  @Transform(recortarOpcional)
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  @MaxLength(20, { message: 'El teléfono admite máximo 20 caracteres' })
  telefono?: string | null;
}
