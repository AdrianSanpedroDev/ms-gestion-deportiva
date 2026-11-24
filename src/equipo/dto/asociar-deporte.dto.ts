import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class AsociarDeporteDto {
  @Min(1, { message: 'El deporte debe ser un identificador entero positivo' })
  @IsInt({ message: 'El deporte debe ser un identificador entero' })
  @IsNotEmpty({ message: 'El deporte es obligatorio' })
  deporteId!: number;
}
