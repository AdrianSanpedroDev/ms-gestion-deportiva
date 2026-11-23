// Helper de B para los partidos de la fase final (ACUERDOS 6.11). Está en utils/ porque no traduce
// entidad ↔ DTO ni habla con la BD: solo CALCULA cuántas llaves tiene una ronda. Es una función pura
// (como puedeCambiarEstado): responde un número y el service decide qué hacer con él.
// Va en utils/ y no junto a EstadoPartido porque no depende del estado del partido (criterio en
// estado-partido.enum.ts): es un cálculo genérico sobre la ronda y la fase.
import { RondaFinal } from '../../fase/entities/ronda-final.enum';

// Cuántos equipos juegan cada ronda. TERCER_PUESTO lo juegan los 2 perdedores de las semifinales.
// Record<RondaFinal, number> obliga a escribir todas las rondas: si falta una, no compila.
export const EQUIPOS_POR_RONDA: Record<RondaFinal, number> = {
  [RondaFinal.DIECISEISAVOS]: 32,
  [RondaFinal.OCTAVOS]: 16,
  [RondaFinal.CUARTOS]: 8,
  [RondaFinal.SEMIFINAL]: 4,
  [RondaFinal.FINAL]: 2,
  [RondaFinal.TERCER_PUESTO]: 2,
};

// Llaves de la ronda en una fase final de "cantidadEquipos" equipos. Devuelve 0 si esa ronda NO existe.
// Ejemplo: fase de 8 equipos → CUARTOS 4 llaves, SEMIFINAL 2, FINAL 1, OCTAVOS 0 (no existe).
export function cantidadLlaves(
  ronda: RondaFinal,
  cantidadEquipos: number,
  tercerPuesto: boolean,
): number {
  // El partido por el tercer puesto (1 llave) solo existe si la fase lo tiene activado Y hay semifinales:
  // lo juegan los 2 perdedores de semifinal, así que hacen falta al menos 4 equipos.
  if (ronda === RondaFinal.TERCER_PUESTO) {
    const haySemifinales = cantidadEquipos >= 4;
    if (tercerPuesto && haySemifinales) {
      return 1;
    }
    return 0;
  }
  const equiposDeLaRonda = EQUIPOS_POR_RONDA[ronda];
  // Una ronda con más equipos que la fase no existe (OCTAVOS en una fase de 8).
  if (equiposDeLaRonda > cantidadEquipos) {
    return 0;
  }
  // Cada llave es un partido entre 2 equipos.
  return equiposDeLaRonda / 2;
}
