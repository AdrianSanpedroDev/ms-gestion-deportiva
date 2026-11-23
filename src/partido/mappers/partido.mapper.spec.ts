import { FaseFinal, Grupo } from '../../fase/entities/fase.entity';
import { EstadoPartido } from '../entities/estado-partido.enum';
import { Partido } from '../entities/partido.entity';
import { PartidoMapper } from './partido.mapper';

const torneo = { id: 1, nombre: 'Copa Caldas 2026', estado: 'EN_CURSO' };

const partido = (extra: Record<string, unknown> = {}): Partido =>
  ({
    id: 20,
    fase: Object.assign(new Grupo(), {
      id: 3,
      nombre: 'Grupo A',
      orden: 1,
      torneo,
    }),
    equipoLocal: { id: 4, nombre: 'Once Caldas', activo: true },
    equipoVisitante: { id: 9, nombre: 'Deportes Pereira', activo: true },
    fechaHora: new Date(2026, 11, 5, 15, 30, 0),
    escenario: { id: 1, nombre: 'Estadio Palogrande', direccion: 'x' },
    ronda: null,
    numeroLlave: null,
    estado: EstadoPartido.PROGRAMADO,
    marcadorLocal: null,
    marcadorVisitante: null,
    ...extra,
  }) as unknown as Partido;

describe('PartidoMapper.aResponse (ACUERDOS 9.10)', () => {
  it('trae exactamente las claves de PartidoResponse, ni más ni menos', () => {
    const r = PartidoMapper.aResponse(partido(), 0);
    expect(Object.keys(r).sort()).toEqual(
      [
        'id',
        'torneo',
        'fase',
        'equipoLocal',
        'equipoVisitante',
        'fechaHora',
        'escenario',
        'ronda',
        'numeroLlave',
        'estado',
        'marcadorLocal',
        'marcadorVisitante',
        'tieneResultado',
        'cantidadAnotaciones',
      ].sort(),
    );
  });

  it('arma los resúmenes sin filtrar campos de las entidades', () => {
    const r = PartidoMapper.aResponse(partido(), 5);
    expect(r.torneo).toEqual(torneo);
    expect(r.fase).toEqual({
      id: 3,
      nombre: 'Grupo A',
      tipo: 'GRUPO',
      orden: 1,
    });
    expect(r.equipoLocal).toEqual({
      id: 4,
      nombre: 'Once Caldas',
      activo: true,
    });
    expect(r.escenario).toEqual({ id: 1, nombre: 'Estadio Palogrande' });
    expect(r.cantidadAnotaciones).toBe(5);
  });

  it('fechaHora como Date sale como "yyyy-MM-ddTHH:mm:ss"', () => {
    const r = PartidoMapper.aResponse(
      partido({ fechaHora: new Date(2026, 0, 2, 3, 4, 5) }),
      0,
    );
    expect(r.fechaHora).toBe('2026-01-02T03:04:05');
  });

  it('escenario null sale como null (la clave existe)', () => {
    const r = PartidoMapper.aResponse(partido({ escenario: null }), 0);
    expect(r).toHaveProperty('escenario', null);
  });

  it('una fase FaseFinal sale con tipo FINAL', () => {
    const fase = Object.assign(new FaseFinal(), {
      id: 5,
      nombre: 'Final',
      orden: 2,
      torneo,
    });
    expect(PartidoMapper.aResponse(partido({ fase }), 0).fase.tipo).toBe(
      'FINAL',
    );
  });

  it('ronda y numeroLlave undefined salen como null', () => {
    const r = PartidoMapper.aResponse(
      partido({ ronda: undefined, numeroLlave: undefined }),
      0,
    );
    expect(r.ronda).toBeNull();
    expect(r.numeroLlave).toBeNull();
  });

  it('tieneResultado va en la respuesta según los marcadores', () => {
    expect(PartidoMapper.aResponse(partido(), 0).tieneResultado).toBe(false);
    expect(
      PartidoMapper.aResponse(
        partido({ marcadorLocal: 2, marcadorVisitante: 1 }),
        0,
      ).tieneResultado,
    ).toBe(true);
    expect(
      PartidoMapper.aResponse(
        partido({ marcadorLocal: 0, marcadorVisitante: 0 }),
        0,
      ).tieneResultado,
    ).toBe(true); // 0-0 es resultado
    expect(
      PartidoMapper.aResponse(partido({ marcadorLocal: 2 }), 0).tieneResultado,
    ).toBe(false);
  });
});
