import { RondaFinal } from '../../fase/entities/ronda-final.enum';
import { cantidadLlaves } from './llaves';

describe('cantidadLlaves (ACUERDOS 6.11)', () => {
  const R = RondaFinal;

  // [ronda, cantidadEquipos, llaves esperadas]: 0 = la ronda no existe en esa fase.
  it.each([
    [R.DIECISEISAVOS, 32, 16],
    [R.OCTAVOS, 32, 8],
    [R.CUARTOS, 32, 4],
    [R.SEMIFINAL, 32, 2],
    [R.FINAL, 32, 1],
    [R.DIECISEISAVOS, 16, 0],
    [R.OCTAVOS, 16, 8],
    [R.CUARTOS, 16, 4],
    [R.OCTAVOS, 8, 0],
    [R.CUARTOS, 8, 4],
    [R.SEMIFINAL, 8, 2],
    [R.FINAL, 8, 1],
    [R.CUARTOS, 4, 0],
    [R.SEMIFINAL, 4, 2],
    [R.FINAL, 4, 1],
    [R.SEMIFINAL, 2, 0],
    [R.FINAL, 2, 1],
  ])(
    '%s en una fase de %i equipos tiene %i llave(s)',
    (ronda, equipos, esperado) => {
      expect(cantidadLlaves(ronda, equipos, false)).toBe(esperado);
    },
  );

  it('TERCER_PUESTO con tercerPuesto true tiene 1 llave', () => {
    expect(cantidadLlaves(R.TERCER_PUESTO, 8, true)).toBe(1);
  });

  it('TERCER_PUESTO con tercerPuesto false no existe (0)', () => {
    expect(cantidadLlaves(R.TERCER_PUESTO, 8, false)).toBe(0);
  });

  it('tercerPuesto true no cambia las llaves de las demás rondas', () => {
    expect(cantidadLlaves(R.SEMIFINAL, 8, true)).toBe(2);
    expect(cantidadLlaves(R.OCTAVOS, 8, true)).toBe(0);
  });
});

// 6.11: el tercer puesto lo juegan los 2 perdedores de semifinal: hacen falta al menos 4 equipos.
describe('cantidadLlaves: TERCER_PUESTO exige tercerPuesto y al menos 4 equipos', () => {
  const R = RondaFinal;

  it.each([
    [2, true, 0], // con 2 equipos no hay semifinales
    [3, true, 0],
    [4, true, 1], // borde: 4 equipos sí
    [8, true, 1],
    [4, false, 0],
    [2, false, 0],
  ])(
    '%i equipos, tercerPuesto %s → %i llave(s)',
    (equipos, tercerPuesto, esperado) => {
      expect(cantidadLlaves(R.TERCER_PUESTO, equipos, tercerPuesto)).toBe(
        esperado,
      );
    },
  );
});
