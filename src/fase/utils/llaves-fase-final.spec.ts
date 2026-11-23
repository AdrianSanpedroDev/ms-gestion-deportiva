import type { Equipo } from '../../equipo/entities/equipo.entity';
import { EstadoPartido } from '../../partido/entities/estado-partido.enum';
import type { Partido } from '../../partido/entities/partido.entity';
import { RondaFinal } from '../entities/ronda-final.enum';
import {
  construirRondasLlaves,
  determinarGanadorPartido,
  rondasParaFaseFinal,
} from './llaves-fase-final';

const equipo = (id: number, nombre: string, activo = true): Equipo =>
  ({ id, nombre, activo }) as Equipo;

const crearPartido = (
  extra: Partial<Partido> & {
    id: number;
    equipoLocal: Equipo;
    equipoVisitante: Equipo;
  },
): Partido =>
  ({
    fechaHora: new Date(2026, 11, 15, 19, 30, 0),
    estado: EstadoPartido.PROGRAMADO,
    marcadorLocal: null,
    marcadorVisitante: null,
    ronda: RondaFinal.SEMIFINAL,
    numeroLlave: 1,
    ...extra,
  }) as Partido;

describe('llaves-fase-final (HU-GC-05)', () => {
  describe('rondasParaFaseFinal', () => {
    it.each([
      [2, false, [{ ronda: RondaFinal.FINAL, cantidadLlaves: 1 }]],
      [2, true, [{ ronda: RondaFinal.FINAL, cantidadLlaves: 1 }]],
      [
        4,
        false,
        [
          { ronda: RondaFinal.SEMIFINAL, cantidadLlaves: 2 },
          { ronda: RondaFinal.FINAL, cantidadLlaves: 1 },
        ],
      ],
      [
        4,
        true,
        [
          { ronda: RondaFinal.SEMIFINAL, cantidadLlaves: 2 },
          { ronda: RondaFinal.FINAL, cantidadLlaves: 1 },
          { ronda: RondaFinal.TERCER_PUESTO, cantidadLlaves: 1 },
        ],
      ],
      [
        8,
        false,
        [
          { ronda: RondaFinal.CUARTOS, cantidadLlaves: 4 },
          { ronda: RondaFinal.SEMIFINAL, cantidadLlaves: 2 },
          { ronda: RondaFinal.FINAL, cantidadLlaves: 1 },
        ],
      ],
      [
        16,
        true,
        [
          { ronda: RondaFinal.OCTAVOS, cantidadLlaves: 8 },
          { ronda: RondaFinal.CUARTOS, cantidadLlaves: 4 },
          { ronda: RondaFinal.SEMIFINAL, cantidadLlaves: 2 },
          { ronda: RondaFinal.FINAL, cantidadLlaves: 1 },
          { ronda: RondaFinal.TERCER_PUESTO, cantidadLlaves: 1 },
        ],
      ],
      [
        32,
        false,
        [
          { ronda: RondaFinal.DIECISEISAVOS, cantidadLlaves: 16 },
          { ronda: RondaFinal.OCTAVOS, cantidadLlaves: 8 },
          { ronda: RondaFinal.CUARTOS, cantidadLlaves: 4 },
          { ronda: RondaFinal.SEMIFINAL, cantidadLlaves: 2 },
          { ronda: RondaFinal.FINAL, cantidadLlaves: 1 },
        ],
      ],
    ])(
      'genera rondas y cantidades exactas para %i equipos (tercerPuesto=%s)',
      (cantidadEquipos, tercerPuesto, esperado) => {
        expect(rondasParaFaseFinal(cantidadEquipos, tercerPuesto)).toEqual(
          esperado,
        );
      },
    );
  });

  describe('determinarGanadorPartido', () => {
    const local = equipo(4, 'Once Caldas');
    const visitante = equipo(9, 'Deportes Pereira');

    it('devuelve el equipo local o visitante cuando el partido está FINALIZADO sin empate', () => {
      const ganaLocal = crearPartido({
        id: 1,
        equipoLocal: local,
        equipoVisitante: visitante,
        estado: EstadoPartido.FINALIZADO,
        marcadorLocal: 2,
        marcadorVisitante: 1,
      });
      const ganaVisitante = crearPartido({
        id: 2,
        equipoLocal: local,
        equipoVisitante: visitante,
        estado: EstadoPartido.FINALIZADO,
        marcadorLocal: 0,
        marcadorVisitante: 3,
      });

      expect(determinarGanadorPartido(ganaLocal)).toEqual({
        id: 4,
        nombre: 'Once Caldas',
        activo: true,
      });
      expect(determinarGanadorPartido(ganaVisitante)).toEqual({
        id: 9,
        nombre: 'Deportes Pereira',
        activo: true,
      });
    });

    it('devuelve null en empate, sin marcador o cuando el partido no ha finalizado', () => {
      const empate = crearPartido({
        id: 3,
        equipoLocal: local,
        equipoVisitante: visitante,
        estado: EstadoPartido.FINALIZADO,
        marcadorLocal: 1,
        marcadorVisitante: 1,
      });
      const enJuego = crearPartido({
        id: 4,
        equipoLocal: local,
        equipoVisitante: visitante,
        estado: EstadoPartido.EN_JUEGO,
        marcadorLocal: 2,
        marcadorVisitante: 0,
      });
      const programado = crearPartido({
        id: 5,
        equipoLocal: local,
        equipoVisitante: visitante,
        estado: EstadoPartido.PROGRAMADO,
      });

      expect(determinarGanadorPartido(empate)).toBeNull();
      expect(determinarGanadorPartido(enJuego)).toBeNull();
      expect(determinarGanadorPartido(programado)).toBeNull();
    });
  });

  describe('construirRondasLlaves', () => {
    const once = equipo(4, 'Once Caldas');
    const pereira = equipo(9, 'Deportes Pereira');
    const quindio = equipo(11, 'Deportes Quindío');
    const tolima = equipo(12, 'Deportes Tolima');

    it('construye todas las rondas y llaves vacías cuando aún no hay partidos', () => {
      const rondas = construirRondasLlaves(4, true, []);

      expect(rondas).toEqual([
        {
          ronda: RondaFinal.SEMIFINAL,
          llaves: [
            { numeroLlave: 1, partido: null, ganador: null },
            { numeroLlave: 2, partido: null, ganador: null },
          ],
        },
        {
          ronda: RondaFinal.FINAL,
          llaves: [{ numeroLlave: 1, partido: null, ganador: null }],
        },
        {
          ronda: RondaFinal.TERCER_PUESTO,
          llaves: [{ numeroLlave: 1, partido: null, ganador: null }],
        },
      ]);
    });

    it('ubica partidos activos en su llave, calcula ganador e ignora partidos CANCELADO', () => {
      const cancelado = crearPartido({
        id: 19,
        equipoLocal: once,
        equipoVisitante: tolima,
        estado: EstadoPartido.CANCELADO,
        ronda: RondaFinal.SEMIFINAL,
        numeroLlave: 1,
      });
      const reprogramadoFinalizado = crearPartido({
        id: 20,
        equipoLocal: once,
        equipoVisitante: pereira,
        estado: EstadoPartido.FINALIZADO,
        marcadorLocal: 2,
        marcadorVisitante: 1,
        ronda: RondaFinal.SEMIFINAL,
        numeroLlave: 1,
      });
      const soloCanceladoEnLlave2 = crearPartido({
        id: 21,
        equipoLocal: quindio,
        equipoVisitante: tolima,
        estado: EstadoPartido.CANCELADO,
        ronda: RondaFinal.SEMIFINAL,
        numeroLlave: 2,
      });

      const rondas = construirRondasLlaves(4, false, [
        cancelado,
        reprogramadoFinalizado,
        soloCanceladoEnLlave2,
      ]);

      expect(rondas).toHaveLength(2);
      expect(rondas[0].llaves[0]).toEqual({
        numeroLlave: 1,
        partido: {
          id: 20,
          equipoLocal: { id: 4, nombre: 'Once Caldas', activo: true },
          equipoVisitante: { id: 9, nombre: 'Deportes Pereira', activo: true },
          fechaHora: '2026-12-15T19:30:00',
          estado: EstadoPartido.FINALIZADO,
          marcadorLocal: 2,
          marcadorVisitante: 1,
          tieneResultado: true,
          ronda: RondaFinal.SEMIFINAL,
          numeroLlave: 1,
        },
        ganador: { id: 4, nombre: 'Once Caldas', activo: true },
      });
      expect(rondas[0].llaves[1]).toEqual({
        numeroLlave: 2,
        partido: null,
        ganador: null,
      });
    });
  });
});
