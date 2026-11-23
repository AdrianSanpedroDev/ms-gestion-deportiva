import { CrearGrupoDto } from './crear-grupo.dto';

// Body de PUT /api/grupos/{id} (HU-GC-04, ACUERDOS 9.15).
// PUT reemplaza ambos campos del grupo (nombre y orden obligatorios).
export class ActualizarGrupoDto extends CrearGrupoDto {}
