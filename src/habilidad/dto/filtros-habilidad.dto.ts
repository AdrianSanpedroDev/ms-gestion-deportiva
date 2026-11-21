import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { aTextoFiltro } from '../../jugador/dto/transformadores';
import { CategoriaHabilidad } from '../entities/categoria-habilidad.enum';

// Filtros opcionales de GET /api/habilidades?nombre=&categoria= (sección 9.9).
// En los dos, "vacío" (?nombre= o ?categoria=) = undefined = sin filtro (nunca null).
export class FiltrosHabilidadDto {
  // Busca las habilidades cuyo nombre CONTIENE este texto.
  @IsOptional()
  @Transform(aTextoFiltro)
  @IsString({ message: 'El nombre debe ser texto' })
  nombre?: string;

  // Si viene, debe ser un valor del enum.
  @IsOptional()
  @Transform(aTextoFiltro)
  @IsEnum(CategoriaHabilidad, {
    message: 'La categoría debe ser TECNICA, FISICA, TACTICA o MENTAL',
  })
  categoria?: CategoriaHabilidad;
}
