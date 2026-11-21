import { CrearHabilidadDto } from './crear-habilidad.dto';

// PUT = reemplazo completo: mismos campos y validaciones que crear (no PartialType, que es para PATCH).
export class ActualizarHabilidadDto extends CrearHabilidadDto {}
