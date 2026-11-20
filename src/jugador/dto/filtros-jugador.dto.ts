import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { recortar } from './transformadores';

// Filtros opcionales de GET /api/jugadores?busqueda=&activo= (sección 9.7).
export class FiltrosJugadorDto {
  @IsOptional()
  @Transform(recortar)
  @IsString({ message: 'La búsqueda debe ser texto' })
  busqueda?: string;

  // En la URL todo llega como texto: "true" → true, "false" → false.
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean({ message: 'activo debe ser true o false' })
  activo?: boolean;
}
