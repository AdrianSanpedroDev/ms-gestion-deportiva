import { CrearAnotacionDto } from './crear-anotacion.dto';

// PUT /api/anotaciones/{id} usa el mismo AnotacionRequest (9.11). PUT = reemplazo completo:
// por eso extends y no PartialType (que sería para PATCH). Se puede cambiar hasta el jugador.
export class ActualizarAnotacionDto extends CrearAnotacionDto {}
