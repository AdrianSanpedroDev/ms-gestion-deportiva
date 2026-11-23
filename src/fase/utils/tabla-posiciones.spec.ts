jest.mock(
  '../../equipo/entities/equipo.entity',
  () => ({ Equipo: class Equipo {} }),
  { virtual: true },
);
jest.mock(
  '../../escenario/entities/escenario.entity',
  () => ({ Escenario: class Escenario {} }),
  { virtual: true },
);
jest.mock(
  '../../torneo/entities/torneo.entity',
  () => ({ Torneo: class Torneo {} }),
  { virtual: true },
);

import type { Equipo } from '../../equipo/entities/equipo.entity';
import { EstadoPartido } from '../../partido/entities/estado-partido.enum';
import type { Partido } from '../../partido/entities/partido.entity';
import { calcularTablaPosiciones } from './tabla-posiciones';

const crearEquipo = (id: number, nombre: string, activo = true): Equipo =>
  ({ id, nombre, activo }) as Equipo;

const crearPartido = (
  equipoLocal: Equipo,
  equipoVisitante: Equipo,
  marcadorLocal: number | null,
  marcadorVisitante: number | null,
  estado = EstadoPartido.FINALIZADO,
): Partido =>
  ({
    equipoLocal,
    equipoVisitante,
    marcadorLocal,
    marcadorVisitante,
    estado,
  }) as Partido;

describe('calcularTablaPosiciones', () => {
  it('muestra equipos sin partidos en ceros ordenados alfabéticamente por nombre', () => {
    const pereira = crearEquipo(9, 'Deportes Pereira');
    const once = crearEquipo(4, 'Once Caldas');
    const aguilas = crearEquipo(11, 'Águilas');

    const tabla = calcularTablaPosiciones([pereira, once, aguilas], []);

    expect(tabla.map((f) => [f.posicion, f.equipo.nombre, f.puntos])).toEqual([
      [1, 'Águilas', 0],
      [2, 'Deportes Pereira', 0],
      [3, 'Once Caldas', 0],
    ]);
    expect(tabla[0]).toEqual({
      posicion: 1,
      equipo: { id: 11, nombre: 'Águilas', activo: true },
      jugados: 0,
      ganados: 0,
      empatados: 0,
      perdidos: 0,
      aFavor: 0,
      enContra: 0,
      diferencia: 0,
      puntos: 0,
    });
  });

  it('calcula puntos (3/1/0), diferencia y aplica todos los criterios de desempate', () => {
    const equipoA = crearEquipo(1, 'Alianza');
    const equipoB = crearEquipo(2, 'Bucaramanga');
    const equipoC = crearEquipo(3, 'Cali');
    const equipoD = crearEquipo(4, 'Deportivo');

    const partidos: Partido[] = [
      // A gana 3-1 a D -> A: 3 pts, dif +2, aFavor 3 | D: 0 pts, dif -2, aFavor 1
      crearPartido(equipoA, equipoD, 3, 1),
      // B gana 2-0 a C -> B: 3 pts, dif +2, aFavor 2 | C: 0 pts, dif -2, aFavor 0
      crearPartido(equipoB, equipoC, 2, 0),
      // A empata 1-1 con B -> A: 4 pts, dif +2, aFavor 4 | B: 4 pts, dif +2, aFavor 3
      crearPartido(equipoA, equipoB, 1, 1),
      // Partido no finalizado o sin resultado debe ignorarse
      crearPartido(equipoC, equipoD, 5, 0, EstadoPartido.EN_JUEGO),
      crearPartido(equipoC, equipoD, null, null, EstadoPartido.FINALIZADO),
    ];

    const tabla = calcularTablaPosiciones(
      [equipoD, equipoC, equipoB, equipoA],
      partidos,
    );

    expect(tabla).toEqual([
      {
        posicion: 1,
        equipo: { id: 1, nombre: 'Alianza', activo: true },
        jugados: 2,
        ganados: 1,
        empatados: 1,
        perdidos: 0,
        aFavor: 4,
        enContra: 2,
        diferencia: 2,
        puntos: 4,
      },
      {
        posicion: 2,
        equipo: { id: 2, nombre: 'Bucaramanga', activo: true },
        jugados: 2,
        ganados: 1,
        empatados: 1,
        perdidos: 0,
        aFavor: 3,
        enContra: 1,
        diferencia: 2,
        puntos: 4,
      },
      {
        posicion: 3,
        equipo: { id: 4, nombre: 'Deportivo', activo: true },
        jugados: 1,
        ganados: 0,
        empatados: 0,
        perdidos: 1,
        aFavor: 1,
        enContra: 3,
        diferencia: -2,
        puntos: 0,
      },
      {
        posicion: 4,
        equipo: { id: 3, nombre: 'Cali', activo: true },
        jugados: 1,
        ganados: 0,
        empatados: 0,
        perdidos: 1,
        aFavor: 0,
        enContra: 2,
        diferencia: -2,
        puntos: 0,
      },
    ]);
  });
});
