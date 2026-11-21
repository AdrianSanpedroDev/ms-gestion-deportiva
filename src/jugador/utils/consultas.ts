// Helper de consultas de B. Está en utils/ (no en mappers/) porque no traduce entidad ↔ DTO:
// PREPARA un texto para la consulta. Refleja el common/utils de ACUERDOS 4.1.
// TODO: mover a common/utils (A).

// Escapa los comodines de LIKE (% y _) y la barra invertida, para que buscar "_" encuentre un guion bajo
// y no "cualquier carácter". El resultado va dentro de Like(`%${texto}%`), que TypeORM manda como parámetro (?).
// La usan jugador.service (busqueda) y habilidad.service (nombre).
export function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, '\\$&'); // "$&" = el carácter encontrado, con una "\" delante
}
