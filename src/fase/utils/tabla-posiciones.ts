// TODO: Equipo es de A (ACUERDOS 6.2 y 6.14); compila cuando A suba equipo/entities/equipo.entity.ts
import type { Equipo } from '../../equipo/entities/equipo.entity';
import { EquipoResumenMapper } from '../../jugador/mappers/equipo-resumen.mapper';
import { EstadoPartido } from '../../partido/entities/estado-partido.enum';
import type { Partido } from '../../partido/entities/partido.entity';
import type { FilaPosicionDto } from '../dto/fila-posicion.dto';

interface AcumuladorPosicion {
  equipo: Equipo;
  jugados: number;
  ganados: number;
  empatados: number;
  perdidos: number;
  aFavor: number;
  enContra: number;
  puntos: number;
}

// Función pura de cálculo de tabla de posiciones de un grupo (HU-GC-04 y HU-GC-08, ACUERDOS 9.15).
// - Solo cuentan partidos FINALIZADO con ambos marcadores registrados.
// - Victoria = 3 pts, empate = 1 pt, derrota = 0 pts.
// - Orden: puntos DESC, diferencia DESC, aFavor DESC, nombre ASC (es), id ASC.
// - Equipos sin partidos jugados aparecen en ceros.
export function calcularTablaPosiciones(
  equipos: Equipo[],
  partidos: Partido[],
): FilaPosicionDto[] {
  const tabla = new Map<number, AcumuladorPosicion>();

  for (const equipo of equipos) {
    if (!tabla.has(equipo.id)) {
      tabla.set(equipo.id, {
        equipo,
        jugados: 0,
        ganados: 0,
        empatados: 0,
        perdidos: 0,
        aFavor: 0,
        enContra: 0,
        puntos: 0,
      });
    }
  }

  for (const partido of partidos) {
    if (
      partido.estado !== EstadoPartido.FINALIZADO ||
      partido.marcadorLocal === null ||
      partido.marcadorVisitante === null
    ) {
      continue;
    }

    const local = tabla.get(partido.equipoLocal.id);
    const visitante = tabla.get(partido.equipoVisitante.id);
    if (!local || !visitante) {
      continue;
    }

    const marcadorLocal = partido.marcadorLocal;
    const marcadorVisitante = partido.marcadorVisitante;

    local.jugados += 1;
    visitante.jugados += 1;
    local.aFavor += marcadorLocal;
    local.enContra += marcadorVisitante;
    visitante.aFavor += marcadorVisitante;
    visitante.enContra += marcadorLocal;

    if (marcadorLocal > marcadorVisitante) {
      local.ganados += 1;
      local.puntos += 3;
      visitante.perdidos += 1;
    } else if (marcadorLocal < marcadorVisitante) {
      visitante.ganados += 1;
      visitante.puntos += 3;
      local.perdidos += 1;
    } else {
      local.empatados += 1;
      local.puntos += 1;
      visitante.empatados += 1;
      visitante.puntos += 1;
    }
  }

  const filasOrdenadas = Array.from(tabla.values())
    .map((item) => ({
      ...item,
      diferencia: item.aFavor - item.enContra,
    }))
    .sort((a, b) => {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      if (b.diferencia !== a.diferencia) return b.diferencia - a.diferencia;
      if (b.aFavor !== a.aFavor) return b.aFavor - a.aFavor;
      const porNombre = a.equipo.nombre.localeCompare(b.equipo.nombre, 'es', {
        sensitivity: 'base',
      });
      if (porNombre !== 0) return porNombre;
      return a.equipo.id - b.equipo.id;
    });

  return filasOrdenadas.map((item, indice) => ({
    posicion: indice + 1,
    equipo: EquipoResumenMapper.aResumen(item.equipo),
    jugados: item.jugados,
    ganados: item.ganados,
    empatados: item.empatados,
    perdidos: item.perdidos,
    aFavor: item.aFavor,
    enContra: item.enContra,
    diferencia: item.diferencia,
    puntos: item.puntos,
  }));
}
