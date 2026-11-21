import { CategoriaHabilidad } from '../entities/categoria-habilidad.enum';

// HabilidadResponse (sección 9.9).
export class HabilidadResponseDto {
  id!: number;
  nombre!: string;
  descripcion!: string | null;
  categoria!: CategoriaHabilidad;
  fechaCreacion!: string;
}
