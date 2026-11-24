import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';

export class CrearInscripcionesDto {
  @Min(1, {
    each: true,
    message: 'Cada equipo debe ser un identificador entero positivo',
  })
  @IsInt({ each: true, message: 'Cada equipo debe ser un identificador entero' })
  @ArrayUnique({ message: 'La lista de equipos no puede contener duplicados' })
  @ArrayMinSize(1, { message: 'Debe seleccionar al menos un equipo' })
  @IsArray({ message: 'Los equipos deben enviarse como lista' })
  equipoIds!: number[];
}
