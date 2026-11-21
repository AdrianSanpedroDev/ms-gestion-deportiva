// "import type": Partido solo se usa como TIPO del parámetro de tieneResultado (la línea desaparece
// al compilar, así que no hay ciclo con partido.entity.ts, que sí importa este enum).
import type { Partido } from './partido.entity';

// Estados de un partido (ACUERDOS 6.12). Valores en texto: en MySQL la columna "estado" es VARCHAR(20).
// Criterio de ubicación: las funciones puras que responden preguntas sobre el ESTADO del partido
// (¿puede cambiar?, ¿admite resultado?, ¿tiene resultado para finalizar?) van aquí, junto al enum.
// Los cálculos genéricos que no dependen del estado (llaves, HTML, minuto) van en utils/.
export enum EstadoPartido {
  PROGRAMADO = 'PROGRAMADO', // estado inicial al crear el partido
  EN_JUEGO = 'EN_JUEGO',
  FINALIZADO = 'FINALIZADO',
  CANCELADO = 'CANCELADO',
}

// Tabla de transiciones permitidas (6.12): a qué estados puede pasar cada estado.
// Record<EstadoPartido, EstadoPartido[]> obliga a escribir los 4 estados: si falta uno, no compila.
export const TRANSICIONES_PARTIDO: Record<EstadoPartido, EstadoPartido[]> = {
  [EstadoPartido.PROGRAMADO]: [EstadoPartido.EN_JUEGO, EstadoPartido.CANCELADO],
  [EstadoPartido.EN_JUEGO]: [EstadoPartido.FINALIZADO, EstadoPartido.CANCELADO],
  [EstadoPartido.FINALIZADO]: [], // estado final: ya no cambia
  [EstadoPartido.CANCELADO]: [], // estado final: ya no cambia
};

// Función pura: solo RESPONDE sí o no, no lanza ni consulta la BD.
// El service decide qué hacer con el "no" (lanzar INVALID_OPERATION con su mensaje).
// Pasar al mismo estado (PROGRAMADO → PROGRAMADO) da false, porque no está en la lista.
export function puedeCambiarEstado(
  actual: EstadoPartido,
  nuevo: EstadoPartido,
): boolean {
  const permitidos = TRANSICIONES_PARTIDO[actual];
  return permitidos.includes(nuevo);
}

// Resultado y anotaciones solo se registran con el partido EN_JUEGO o FINALIZADO (6.12 y 6.13).
// Una sola fuente para PartidoService.registrarResultado y AnotacionService. Pura, como puedeCambiarEstado.
export function admiteResultadoYAnotaciones(estado: EstadoPartido): boolean {
  return (
    estado === EstadoPartido.EN_JUEGO || estado === EstadoPartido.FINALIZADO
  );
}

// "Tiene resultado" = los DOS marcadores registrados (5.6). Es una REGLA (pasar a FINALIZADO lo exige),
// no una traducción: por eso vive aquí y no en el mapper. La usan PartidoService (finalizar),
// AnotacionService (correo) y PartidoMapper (campo tieneResultado de la respuesta).
export function tieneResultado(partido: Partido): boolean {
  return partido.marcadorLocal !== null && partido.marcadorVisitante !== null;
}
