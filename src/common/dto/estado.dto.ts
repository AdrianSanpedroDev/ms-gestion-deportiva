import { IsBoolean } from 'class-validator';

export class EstadoDto {
  @IsBoolean({ message: 'El campo activo debe ser booleano' })
  activo!: boolean;
}
