// Rondas válidas de la fase final según cantidad_equipos y tercer_puesto (ACUERDOS 6.11 y 13.1).
// Lo consumen tanto C (fase final, llaves, desarrollo) como B (partidos de fase final).
export enum RondaFinal {
  DIECISEISAVOS = 'DIECISEISAVOS',
  OCTAVOS = 'OCTAVOS',
  CUARTOS = 'CUARTOS',
  SEMIFINAL = 'SEMIFINAL',
  TERCER_PUESTO = 'TERCER_PUESTO',
  FINAL = 'FINAL',
}
