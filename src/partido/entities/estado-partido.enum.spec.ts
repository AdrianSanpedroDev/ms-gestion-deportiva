import {
  EstadoPartido,
  TRANSICIONES_PARTIDO,
  admiteResultadoYAnotaciones,
  puedeCambiarEstado,
  tieneResultado,
} from './estado-partido.enum';
import type { Partido } from './partido.entity';

// Contrato: ACUERDOS 6.12 (tabla de transiciones de EstadoPartido).
const { PROGRAMADO, EN_JUEGO, FINALIZADO, CANCELADO } = EstadoPartido;
const TODOS = [PROGRAMADO, EN_JUEGO, FINALIZADO, CANCELADO];

const VALIDAS: [EstadoPartido, EstadoPartido][] = [
  [PROGRAMADO, EN_JUEGO],
  [PROGRAMADO, CANCELADO],
  [EN_JUEGO, FINALIZADO],
  [EN_JUEGO, CANCELADO],
];

const esValida = (a: EstadoPartido, b: EstadoPartido) =>
  VALIDAS.some(([x, y]) => x === a && y === b);

describe('EstadoPartido', () => {
  it('tiene exactamente los 4 estados del contrato', () => {
    expect(Object.values(EstadoPartido).sort()).toEqual(
      ['CANCELADO', 'EN_JUEGO', 'FINALIZADO', 'PROGRAMADO'].sort(),
    );
  });
});

describe('puedeCambiarEstado', () => {
  describe('las 4 transiciones válidas', () => {
    it.each(VALIDAS)('%s -> %s es true', (actual, nuevo) => {
      expect(puedeCambiarEstado(actual, nuevo)).toBe(true);
    });
  });

  describe('las 12 combinaciones no permitidas (incluido el mismo estado)', () => {
    const invalidas = TODOS.flatMap((a) => TODOS.map((b) => [a, b] as const))
      .filter(([a, b]) => !esValida(a, b))
      .map(([a, b]) => [a, b] as [EstadoPartido, EstadoPartido]);

    it('son exactamente 12', () => {
      expect(invalidas).toHaveLength(12);
    });

    it.each(invalidas)('%s -> %s es false', (actual, nuevo) => {
      expect(puedeCambiarEstado(actual, nuevo)).toBe(false);
    });
  });

  it('pasar al mismo estado es false en los 4 estados', () => {
    for (const e of TODOS) {
      expect(puedeCambiarEstado(e, e)).toBe(false);
    }
  });

  it('no se puede saltar de PROGRAMADO a FINALIZADO (debe pasar por EN_JUEGO)', () => {
    expect(puedeCambiarEstado(PROGRAMADO, FINALIZADO)).toBe(false);
  });

  it('no se puede volver atrás (EN_JUEGO -> PROGRAMADO)', () => {
    expect(puedeCambiarEstado(EN_JUEGO, PROGRAMADO)).toBe(false);
  });

  describe('estados finales', () => {
    it.each([FINALIZADO, CANCELADO])(
      '%s no tiene transiciones: ningún destino es posible',
      (final) => {
        for (const destino of TODOS) {
          expect(puedeCambiarEstado(final, destino)).toBe(false);
        }
      },
    );

    it.each([FINALIZADO, CANCELADO])(
      'la tabla TRANSICIONES_PARTIDO deja %s con lista vacía',
      (final) => {
        expect(TRANSICIONES_PARTIDO[final]).toEqual([]);
      },
    );
  });

  it('la tabla tiene entrada para los 4 estados', () => {
    expect(Object.keys(TRANSICIONES_PARTIDO).sort()).toEqual([...TODOS].sort());
  });
});

// Contrato: ACUERDOS 6.12 (resultado) y 6.13 (anotaciones): solo EN_JUEGO o FINALIZADO.
describe('admiteResultadoYAnotaciones', () => {
  it.each([EN_JUEGO, FINALIZADO])('%s admite resultado y anotaciones', (e) => {
    expect(admiteResultadoYAnotaciones(e)).toBe(true);
  });

  it.each([PROGRAMADO, CANCELADO])(
    '%s no admite resultado ni anotaciones',
    (e) => {
      expect(admiteResultadoYAnotaciones(e)).toBe(false);
    },
  );

  it('de los 4 estados, exactamente 2 lo admiten', () => {
    expect(TODOS.filter((e) => admiteResultadoYAnotaciones(e))).toEqual([
      EN_JUEGO,
      FINALIZADO,
    ]);
  });
});

// Contrato: ACUERDOS 5.6 y 6.12: "tiene resultado" = los DOS marcadores registrados (0 cuenta).
describe('tieneResultado', () => {
  const conMarcador = (
    local: number | null,
    visitante: number | null,
  ): Partido =>
    ({ marcadorLocal: local, marcadorVisitante: visitante }) as Partido;

  it.each([
    [null, null, false],
    [2, null, false],
    [null, 1, false],
    [2, 1, true],
    [0, 0, true], // 0-0 es resultado: no se confunde 0 con "sin resultado"
    [0, null, false],
    [null, 0, false],
  ])('local %s, visitante %s → %s', (local, visitante, esperado) => {
    expect(tieneResultado(conMarcador(local, visitante))).toBe(esperado);
  });
});
