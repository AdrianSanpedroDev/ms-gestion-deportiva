import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { aBooleanoOpcional, aTextoFiltro } from './transformadores';

// Filtros opcionales de GET /api/jugadores?busqueda=&activo= (sección 9.7).
// En los dos, "vacío" (?busqueda= o ?activo=) = undefined = sin filtro.
export class FiltrosJugadorDto {
  @IsOptional()
  @Transform(aTextoFiltro)
  @IsString({ message: 'La búsqueda debe ser texto' })
  busqueda?: string;

  // En la URL todo llega como texto: "true" → true, "false" → false.
  @IsOptional()
  @Transform(aBooleanoOpcional)
  @IsBoolean({ message: 'activo debe ser true o false' })
  activo?: boolean;
}
