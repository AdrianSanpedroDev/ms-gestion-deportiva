import { CrearPartidoDto } from './crear-partido.dto';

// PUT /api/partidos/{id} usa el mismo PartidoRequest (9.10). PUT = reemplazo completo, todo lo obligatorio
// sigue obligatorio: por eso extends y no PartialType (que sería para PATCH).
// "Solo se edita en PROGRAMADO" es una regla del service, no del DTO.
export class ActualizarPartidoDto extends CrearPartidoDto {}
