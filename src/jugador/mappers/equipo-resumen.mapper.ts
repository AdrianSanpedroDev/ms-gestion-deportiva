// "import type": solo se usan como TIPOS (las líneas desaparecen al compilar).
import type { EquipoResumen } from '../../common/dto/equipo-resumen.dto';
import type { Equipo } from '../../equipo/entities/equipo.entity';

// EquipoResumen (5.6) en UN solo lugar. Lo usan EquipoJugadorMapper (contratos) y PartidoMapper
// (local y visitante); más adelante el de anotaciones. Así no se arma { id, nombre, activo } a mano en cada uno.
// TODO: si A publica un mapper de Equipo con aResumen, usar ese y borrar este archivo.
export class EquipoResumenMapper {
  static aResumen(equipo: Equipo): EquipoResumen {
    return {
      id: equipo.id,
      nombre: equipo.nombre,
      activo: equipo.activo,
    };
  }
}
