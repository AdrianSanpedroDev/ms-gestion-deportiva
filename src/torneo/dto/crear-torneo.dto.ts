import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CrearTorneoDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(150)
  nombre!: string;
  @IsInt({ message: 'El deporte debe ser un identificador entero' })
  deporteId!: number;
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;
  @IsDateString({}, { message: 'La fecha de inicio debe tener formato yyyy-MM-dd' })
  fechaInicio!: string;
  @IsDateString({}, { message: 'La fecha fin debe tener formato yyyy-MM-dd' })
  fechaFin!: string;
  @IsDateString({}, { message: 'La fecha de cierre debe tener formato yyyy-MM-dd' })
  fechaCierreInscripciones!: string;
  @IsOptional()
  @IsInt()
  @Min(2)
  maxEquipos?: number;
}
