import { EstadoPartido } from '../entities/estado-partido.enum';

// Mensaje de @IsEnum(EstadoPartido) para los DTOs que lo usan (CambiarEstadoPartidoDto y FiltrosPartidoFaseDto).
// Los valores se LEEN del enum: Object.values(EstadoPartido) = ['PROGRAMADO', 'EN_JUEGO', ...].
// Si mañana se agrega un estado, el mensaje se actualiza solo (no hay que corregir textos a mano).
export const MENSAJE_ESTADO_PARTIDO = `El estado debe ser uno de estos valores: ${Object.values(EstadoPartido).join(', ')}`;
