import type { Equipo } from '../../equipo/entities/equipo.entity';
import { FaseFinal, Grupo } from '../../fase/entities/fase.entity';
import { RondaFinal } from '../../fase/entities/ronda-final.enum';
import { TipoFase } from '../../fase/entities/tipo-fase.enum';
import { EstadoPartido } from '../../partido/entities/estado-partido.enum';
import type { Partido } from '../../partido/entities/partido.entity';
import { EstadoTorneo } from '../../torneo/entities/estado-torneo.enum';
import type { Torneo } from '../../torneo/entities/torneo.entity';
import { DesarrolloMapper } from './desarrollo.mapper';

describe('DesarrolloMapper (HU-GC-08)', () => {
  const torneo: Torneo = {
    id: 1,
    nombre: 'Copa Caldas 2026',
    deporte: { id: 1, nombre: 'Fútbol', activo: true },
    fechaInicio: '2026-12-01',
    fechaFin: '2026-12-20',
    estado: EstadoTorneo.EN_CURSO,
  } as unknown as Torneo;

  const equipoZ = { id: 9, nombre: 'Deportes Pereira', activo: true } as Equipo;
  const equipoA = { id: 4, nombre: 'Once Caldas', activo: true } as Equipo;

  const partidoFinalizado = {
    id: 20,
    equipoLocal: equipoA,
    equipoVisitante: equipoZ,
    fechaHora: new Date(2026, 11, 5, 15, 30, 0),
    estado: EstadoPartido.FINALIZADO,
    marcadorLocal: 2,
    marcadorVisitante: 1,
    ronda: null,
    numeroLlave: null,
  } as Partido;

  it('mapea TorneoDesarrolloDto con deporte resumido y cantidadInscritos', () => {
    expect(DesarrolloMapper.aTorneoDesarrollo(torneo, 8)).toEqual({
      id: 1,
      nombre: 'Copa Caldas 2026',
      deporte: { id: 1, nombre: 'Fútbol', activo: true },
      fechaInicio: '2026-12-01',
      fechaFin: '2026-12-20',
      estado: 'EN_CURSO',
      cantidadInscritos: 8,
    });
  });

  it('mapea una fase GRUPO con equipos ordenados, tablaPosiciones, llaves=null y partidos resumidos', () => {
    const grupo = new Grupo();
    grupo.id = 3;
    grupo.nombre = 'Grupo A';
    grupo.orden = 1;

    const tabla = [
      {
        posicion: 1,
        equipo: { id: 4, nombre: 'Once Caldas', activo: true },
        jugados: 1,
        ganados: 1,
        empatados: 0,
        perdidos: 0,
        aFavor: 2,
        enContra: 1,
        diferencia: 1,
        puntos: 3,
      },
    ];

    const dto = DesarrolloMapper.aFaseGrupoDesarrollo(
      grupo,
      [equipoA, equipoZ],
      tabla,
      [partidoFinalizado],
    );

    expect(dto).toEqual({
      id: 3,
      nombre: 'Grupo A',
      tipo: TipoFase.GRUPO,
      orden: 1,
      equipos: [
        { id: 9, nombre: 'Deportes Pereira', activo: true },
        { id: 4, nombre: 'Once Caldas', activo: true },
      ],
      tablaPosiciones: tabla,
      llaves: null,
      partidos: [
        {
          id: 20,
          equipoLocal: { id: 4, nombre: 'Once Caldas', activo: true },
          equipoVisitante: { id: 9, nombre: 'Deportes Pereira', activo: true },
          fechaHora: '2026-12-05T15:30:00',
          estado: EstadoPartido.FINALIZADO,
          marcadorLocal: 2,
          marcadorVisitante: 1,
          tieneResultado: true,
          ronda: null,
          numeroLlave: null,
        },
      ],
    });
  });

  it('mapea una fase FINAL con equipos=null, tablaPosiciones=null, llaves y partidos resumidos', () => {
    const faseFinal = new FaseFinal();
    faseFinal.id = 8;
    faseFinal.nombre = 'Fase final';
    faseFinal.orden = 2;
    faseFinal.cantidadEquipos = 2;
    faseFinal.tercerPuesto = false;

    const partidoFinal = {
      ...partidoFinalizado,
      id: 30,
      ronda: RondaFinal.FINAL,
      numeroLlave: 1,
    } as Partido;

    const llaves = [
      {
        ronda: RondaFinal.FINAL,
        llaves: [
          {
            numeroLlave: 1,
            partido: {
              id: 30,
              equipoLocal: { id: 4, nombre: 'Once Caldas', activo: true },
              equipoVisitante: {
                id: 9,
                nombre: 'Deportes Pereira',
                activo: true,
              },
              fechaHora: '2026-12-05T15:30:00',
              estado: EstadoPartido.FINALIZADO,
              marcadorLocal: 2,
              marcadorVisitante: 1,
              tieneResultado: true,
              ronda: RondaFinal.FINAL,
              numeroLlave: 1,
            },
            ganador: { id: 4, nombre: 'Once Caldas', activo: true },
          },
        ],
      },
    ];

    const dto = DesarrolloMapper.aFaseFinalDesarrollo(faseFinal, llaves, [
      partidoFinal,
    ]);

    expect(dto.tipo).toBe(TipoFase.FINAL);
    expect(dto.equipos).toBeNull();
    expect(dto.tablaPosiciones).toBeNull();
    expect(dto.llaves).toEqual(llaves);
    expect(dto.partidos).toHaveLength(1);
    expect(dto.partidos[0].ronda).toBe(RondaFinal.FINAL);
    expect(dto.partidos[0].numeroLlave).toBe(1);
  });

  it('ensambla DesarrolloTorneoResponseDto completo con aResponse', () => {
    const respuesta = DesarrolloMapper.aResponse(
      torneo,
      4,
      { totalPartidos: 2, conResultado: 1, pendientes: 1 },
      [],
    );

    expect(respuesta).toEqual({
      torneo: {
        id: 1,
        nombre: 'Copa Caldas 2026',
        deporte: { id: 1, nombre: 'Fútbol', activo: true },
        fechaInicio: '2026-12-01',
        fechaFin: '2026-12-20',
        estado: 'EN_CURSO',
        cantidadInscritos: 4,
      },
      resumen: { totalPartidos: 2, conResultado: 1, pendientes: 1 },
      fases: [],
    });
  });
});
