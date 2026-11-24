import type { CategoriaHabilidad } from '../../habilidad/entities/categoria-habilidad.enum';

export interface HabilidadResumen {
  id: number;
  nombre: string;
  categoria: CategoriaHabilidad;
}
