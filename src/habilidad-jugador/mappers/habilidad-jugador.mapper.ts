import type { JugadorResumen } from '../../common/dto/jugador-resumen.dto';
import { Habilidad } from '../../habilidad/entities/habilidad.entity';
import { Jugador } from '../../jugador/entities/jugador.entity';
import { JugadorMapper } from '../../jugador/mappers/jugador.mapper';
import type { HabilidadResumen } from '../../common/dto/habilidad-resumen.dto';
import { HabilidadJugador } from '../entities/habilidad-jugador.entity';

export class HabilidadJugadorMapper {
  static aDatosEntidad(
    jugador: Jugador,
    habilidad: Habilidad,
  ): Partial<HabilidadJugador> {
    return {
      jugador,
      habilidad,
    };
  }

  // HabilidadResumen (ACUERDOS 5.6): solo 3 campos (id, nombre, categoria).
  static aHabilidadResumen(habilidad: Habilidad): HabilidadResumen {
    return {
      id: habilidad.id,
      nombre: habilidad.nombre,
      categoria: habilidad.categoria,
    };
  }

  // Reutiliza JugadorMapper.aResumen de B (ACUERDOS 13.3).
  static aJugadorResumen(jugador: Jugador): JugadorResumen {
    return JugadorMapper.aResumen(jugador);
  }
}
