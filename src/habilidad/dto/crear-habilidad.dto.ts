import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
// Se reutilizan los transformadores de jugador (mismo dueño, B): no se copian.
import { recortar, recortarOpcional } from '../../jugador/dto/transformadores';
import { CategoriaHabilidad } from '../entities/categoria-habilidad.enum';

// HabilidadRequest (sección 9.9).
// Orden de los decoradores: se aplican de ABAJO hacia ARRIBA, y el filtro de A muestra el primer mensaje,
// que es el del decorador más cercano a la propiedad. Por eso @IsNotEmpty va pegado a la propiedad,
// encima el tipo (@IsString / @IsEnum) y arriba del todo el largo (@MaxLength).
export class CrearHabilidadDto {
  @Transform(recortar)
  @MaxLength(100, { message: 'El nombre admite máximo 100 caracteres' })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre!: string;

  // Opcional: "" o "   " se convierte en null (sin dato) antes de validar.
  @Transform(recortarOpcional)
  @IsOptional()
  @MaxLength(500, { message: 'La descripción admite máximo 500 caracteres' })
  @IsString({ message: 'La descripción debe ser texto' })
  descripcion?: string | null;

  // recortar igual que en el filtro: " TECNICA " → "TECNICA" (un solo criterio).
  @Transform(recortar)
  @IsEnum(CategoriaHabilidad, {
    message: 'La categoría debe ser TECNICA, FISICA, TACTICA o MENTAL',
  })
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  categoria!: CategoriaHabilidad;
}
