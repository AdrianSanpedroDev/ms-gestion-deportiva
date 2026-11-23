// TODO: verificar ruta cuando A suba common/dto/equipo-resumen.dto.ts (ACUERDOS 5.6 y 13.1)
import type { EquipoResumen } from '../../common/dto/equipo-resumen.dto';
import { EquipoResumenMapper } from '../../jugador/mappers/equipo-resumen.mapper';
import { EstadoPartido } from '../../partido/entities/estado-partido.enum';
import type { Partido } from '../../partido/entities/partido.entity';
import type { LlaveDto, RondaLlavesDto } from '../dto/llaves-response.dto';
import { RondaFinal } from '../entities/ronda-final.enum';
import { FaseFinalMapper } from '../mappers/fase-final.mapper';

export interface RondaEsperada {
  ronda: RondaFinal;
  cantidadLlaves: number;
}

const RONDAS_ELIMINATORIAS: readonly { ronda: RondaFinal; equipos: number }[] =
  [
    { ronda: RondaFinal.DIECISEISAVOS, equipos: 32 },
    { ronda: RondaFinal.OCTAVOS, equipos: 16 },
    { ronda: RondaFinal.CUARTOS, equipos: 8 },
    { ronda: RondaFinal.SEMIFINAL, equipos: 4 },
    { ronda: RondaFinal.FINAL, equipos: 2 },
  ];

// Devuelve todas las rondas en orden según cantidadEquipos y tercerPuesto (ACUERDOS 6.11 y 9.16).
// TERCER_PUESTO solo existe si tercerPuesto = true y hay semifinales (cantidadEquipos >= 4),
// alineado con src/partido/utils/llaves.ts de Persona B.
export function rondasParaFaseFinal(
  cantidadEquipos: number,
  tercerPuesto: boolean,
): RondaEsperada[] {
  const rondas: RondaEsperada[] = RONDAS_ELIMINATORIAS.filter(
    (item) => item.equipos <= cantidadEquipos,
  ).map((item) => ({
    ronda: item.ronda,
    cantidadLlaves: item.equipos / 2,
  }));

  if (tercerPuesto && cantidadEquipos >= 4) {
    rondas.push({
      ronda: RondaFinal.TERCER_PUESTO,
      cantidadLlaves: 1,
    });
  }

  return rondas;
}

// Ganador de un partido de llave (ACUERDOS 9.16): equipo con mayor marcador solo si está FINALIZADO.
// Si empataron o aún no finaliza, devuelve null.
export function determinarGanadorPartido(
  partido: Partido,
): EquipoResumen | null {
  if (
    partido.estado !== EstadoPartido.FINALIZADO ||
    partido.marcadorLocal === null ||
    partido.marcadorVisitante === null
  ) {
    return null;
  }

  if (partido.marcadorLocal > partido.marcadorVisitante) {
    return EquipoResumenMapper.aResumen(partido.equipoLocal);
  }
  if (partido.marcadorVisitante > partido.marcadorLocal) {
    return EquipoResumenMapper.aResumen(partido.equipoVisitante);
  }

  return null;
}

// Función pura reutilizable por HU-GC-05 (llaves) y HU-GC-08 (desarrollo del torneo).
// - Genera siempre todas las rondas y llaves (1..N) aunque no tengan partido (partido: null, ganador: null).
// - Ignora partidos CANCELADO para no colisionar con reprogramaciones ni ocupar llaves vacías.
export function construirRondasLlaves(
  cantidadEquipos: number,
  tercerPuesto: boolean,
  partidos: Partido[],
): RondaLlavesDto[] {
  const partidoPorClave = new Map<string, Partido>();

  for (const partido of partidos) {
    if (
      partido.estado === EstadoPartido.CANCELADO ||
      partido.ronda === null ||
      partido.numeroLlave === null
    ) {
      continue;
    }
    const clave = `${partido.ronda}:${partido.numeroLlave}`;
    if (!partidoPorClave.has(clave)) {
      partidoPorClave.set(clave, partido);
    }
  }

  return rondasParaFaseFinal(cantidadEquipos, tercerPuesto).map((esperada) => {
    const llaves: LlaveDto[] = [];

    for (
      let numeroLlave = 1;
      numeroLlave <= esperada.cantidadLlaves;
      numeroLlave += 1
    ) {
      const partido =
        partidoPorClave.get(`${esperada.ronda}:${numeroLlave}`) ?? null;

      llaves.push({
        numeroLlave,
        partido: partido ? FaseFinalMapper.aPartidoResumen(partido) : null,
        ganador: partido ? determinarGanadorPartido(partido) : null,
      });
    }

    return {
      ronda: esperada.ronda,
      llaves,
    };
  });
}
