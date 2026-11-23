import { ArrayMinSize, IsArray, IsInt } from 'class-validator';

export class CrearInscripcionesDto {
  @IsArray({ message: 'Los equipos deben enviarse como lista' })
  @ArrayMinSize(1, { message: 'Debe seleccionar al menos un equipo' })
  @IsInt({ each: true, message: 'Cada equipo debe ser un identificador entero' })
  equipoIds!: number[];
}
