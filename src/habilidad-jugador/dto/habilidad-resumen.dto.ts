import type { CategoriaHabilidad } from '../../habilidad/entities/categoria-habilidad.enum';

// HabilidadResumen (ACUERDOS 5.6): definido en carpeta de Persona C mientras no exista en common/dto/.
export interface HabilidadResumen {
  id: number;
  nombre: string;
  categoria: CategoriaHabilidad;
}
