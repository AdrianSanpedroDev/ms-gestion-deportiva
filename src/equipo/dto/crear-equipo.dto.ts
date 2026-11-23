import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CrearEquipoDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres' })
  nombre!: string;

  @IsString({ message: 'La ciudad debe ser texto' })
  @IsNotEmpty({ message: 'La ciudad es obligatoria' })
  @MaxLength(100)
  ciudad!: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fundación debe tener formato yyyy-MM-dd' })
  fechaFundacion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;
}
