import { CrearFaseFinalDto } from './crear-fase-final.dto';

// Body de PUT /api/fases-finales/{id} (HU-GC-05, ACUERDOS 9.16).
// PUT reemplaza la configuración de la fase final (tercerPuesto sigue siendo opcional → false).
export class ActualizarFaseFinalDto extends CrearFaseFinalDto {}
