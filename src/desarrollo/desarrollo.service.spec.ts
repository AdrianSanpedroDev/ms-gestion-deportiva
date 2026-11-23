// =====================================================================================
// TEMPORAL: quitar los jest.mock virtuales cuando A suba common/errores, torneo/entities,
// equipo/entities y escenario/entities (DT-C4).
// =====================================================================================
jest.mock(
  '../common/errores/error-case.enum',
  () => ({
    ErrorCase: {
      NOT_FOUND: 'NOT_FOUND',
      ALREADY_EXISTS: 'ALREADY_EXISTS',
      HAS_ASSOCIATIONS: 'HAS_ASSOCIATIONS',
      INVALID_OPERATION: 'INVALID_OPERATION',
      UNAUTHORIZED: 'UNAUTHORIZED',
      FORBIDDEN: 'FORBIDDEN',
      SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    },
  }),
  { virtual: true },
);
jest.mock(
  '../common/errores/application.exception',
  () => ({
    ApplicationException: class ApplicationException extends Error {
      constructor(
        public readonly errorCase: string,
        message: string,
      ) {
        super(message);
      }
    },
  }),
  { virtual: true },
);
jest.mock(
  '../torneo/entities/estado-torneo.enum',
  () => ({
    EstadoTorneo: {
      INSCRIPCIONES_ABIERTAS: 'INSCRIPCIONES_ABIERTAS',
      INSCRIPCIONES_CERRADAS: 'INSCRIPCIONES_CERRADAS',
      EN_CURSO: 'EN_CURSO',
      FINALIZADO: 'FINALIZADO',
      CANCELADO: 'CANCELADO',
    },
  }),
  { virtual: true },
);
jest.mock(
  '../torneo/entities/torneo.entity',
  () => ({ Torneo: class Torneo {} }),
  { virtual: true },
);
jest.mock(
  '../torneo/entities/inscripcion.entity',
  () => ({ Inscripcion: class Inscripcion {} }),
  { virtual: true },
);
jest.mock(
  '../equipo/entities/equipo.entity',
  () => ({ Equipo: class Equipo {} }),
  { virtual: true },
);
jest.mock(
  '../escenario/entities/escenario.entity',
  () => ({ Escenario: class Escenario {} }),
  { virtual: true },
);

import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
import type { Equipo } from '../equipo/entities/equipo.entity';
import { Fase, FaseFinal, Grupo } from '../fase/entities/fase.entity';
import { GrupoEquipo } from '../fase/entities/grupo-equipo.entity';
import { RondaFinal } from '../fase/entities/ronda-final.enum';
import { TipoFase } from '../fase/entities/tipo-fase.enum';
import { EstadoPartido } from '../partido/entities/estado-partido.enum';
import { Partido } from '../partido/entities/partido.entity';
import { EstadoTorneo } from '../torneo/entities/estado-torneo.enum';
import { Inscripcion } from '../torneo/entities/inscripcion.entity';
import { Torneo } from '../torneo/entities/torneo.entity';
import { DesarrolloService } from './desarrollo.service';

const crearTorneo = (extra: Record<string, unknown> = {}): Torneo =>
  ({
    id: 1,
    nombre: 'Copa Caldas 2026',
    deporte: { id: 1, nombre: 'Fútbol', activo: true },
    fechaInicio: '2026-12-01',
    fechaFin: '2026-12-20',
    estado: EstadoTorneo.EN_CURSO,
    ...extra,
  }) as unknown as Torneo;

const crearGrupo = (id: number, nombre: string, orden: number): Grupo => {
  const grupo = new Grupo();
  grupo.id = id;
  grupo.nombre = nombre;
  grupo.orden = orden;
  return grupo;
};

const crearFaseFinal = (
  id: number,
  nombre: string,
  orden: number,
  cantidadEquipos: number,
  tercerPuesto: boolean,
): FaseFinal => {
  const faseFinal = new FaseFinal();
  faseFinal.id = id;
  faseFinal.nombre = nombre;
  faseFinal.orden = orden;
  faseFinal.cantidadEquipos = cantidadEquipos;
  faseFinal.tercerPuesto = tercerPuesto;
  return faseFinal;
};

describe('DesarrolloService (HU-GC-08)', () => {
  let service: DesarrolloService;
  let torneoRepository: Record<string, jest.Mock>;
  let inscripcionRepository: Record<string, jest.Mock>;
  let faseRepository: Record<string, jest.Mock>;
  let grupoEquipoRepository: Record<string, jest.Mock>;
  let partidoRepository: Record<string, jest.Mock>;

  beforeEach(async () => {
    torneoRepository = { findOne: jest.fn() };
    inscripcionRepository = { countBy: jest.fn() };
    faseRepository = { find: jest.fn() };
    grupoEquipoRepository = { find: jest.fn() };
    partidoRepository = { find: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        DesarrolloService,
        { provide: getRepositoryToken(Torneo), useValue: torneoRepository },
        {
          provide: getRepositoryToken(Inscripcion),
          useValue: inscripcionRepository,
        },
        { provide: getRepositoryToken(Fase), useValue: faseRepository },
        {
          provide: getRepositoryToken(GrupoEquipo),
          useValue: grupoEquipoRepository,
        },
        { provide: getRepositoryToken(Partido), useValue: partidoRepository },
      ],
    }).compile();

    service = moduleRef.get(DesarrolloService);
  });

  it('lanza NOT_FOUND si el torneo no existe', async () => {
    torneoRepository.findOne.mockResolvedValue(null);

    const promesa = service.obtenerDesarrollo(999);
    await expect(promesa).rejects.toBeInstanceOf(ApplicationException);
    await expect(promesa).rejects.toMatchObject({
      errorCase: ErrorCase.NOT_FOUND,
    });
    expect(inscripcionRepository.countBy).not.toHaveBeenCalled();
    expect(faseRepository.find).not.toHaveBeenCalled();
  });

  it('devuelve fases vacías y resumen en ceros cuando el torneo no tiene fases', async () => {
    torneoRepository.findOne.mockResolvedValue(crearTorneo());
    inscripcionRepository.countBy.mockResolvedValue(6);
    faseRepository.find.mockResolvedValue([]);

    const resultado = await service.obtenerDesarrollo(1);

    expect(resultado).toEqual({
      torneo: {
        id: 1,
        nombre: 'Copa Caldas 2026',
        deporte: { id: 1, nombre: 'Fútbol', activo: true },
        fechaInicio: '2026-12-01',
        fechaFin: '2026-12-20',
        estado: EstadoTorneo.EN_CURSO,
        cantidadInscritos: 6,
      },
      resumen: { totalPartidos: 0, conResultado: 0, pendientes: 0 },
      fases: [],
    });
    expect(grupoEquipoRepository.find).not.toHaveBeenCalled();
    expect(partidoRepository.find).not.toHaveBeenCalled();
  });

  it('consolida grupos (equipos + tabla de posiciones), fase final (llaves + ganadores) y resumen excluyendo CANCELADO de pendientes', async () => {
    const equipo1 = { id: 4, nombre: 'Once Caldas', activo: true } as Equipo;
    const equipo2 = {
      id: 9,
      nombre: 'Deportes Pereira',
      activo: true,
    } as Equipo;
    const equipo3 = { id: 11, nombre: 'América', activo: true } as Equipo;

    const grupoA = crearGrupo(3, 'Grupo A', 1);
    const grupoB = crearGrupo(4, 'Grupo B', 1);
    const faseFinal = crearFaseFinal(8, 'Fase final', 2, 4, true);

    torneoRepository.findOne.mockResolvedValue(crearTorneo());
    inscripcionRepository.countBy.mockResolvedValue(8);
    faseRepository.find.mockResolvedValue([grupoA, grupoB, faseFinal]);

    grupoEquipoRepository.find.mockResolvedValue([
      { grupo: grupoA, equipo: equipo1 },
      { grupo: grupoA, equipo: equipo2 },
      { grupo: grupoA, equipo: equipo3 },
    ]);

    const partidoGrupoFinalizado = {
      id: 20,
      fase: grupoA,
      equipoLocal: equipo1,
      equipoVisitante: equipo2,
      fechaHora: new Date(2026, 11, 5, 15, 30, 0),
      estado: EstadoPartido.FINALIZADO,
      marcadorLocal: 2,
      marcadorVisitante: 1,
      ronda: null,
      numeroLlave: null,
    } as Partido;

    const partidoGrupoProgramado = {
      id: 21,
      fase: grupoA,
      equipoLocal: equipo2,
      equipoVisitante: equipo3,
      fechaHora: new Date(2026, 11, 6, 18, 0, 0),
      estado: EstadoPartido.PROGRAMADO,
      marcadorLocal: null,
      marcadorVisitante: null,
      ronda: null,
      numeroLlave: null,
    } as Partido;

    const partidoGrupoCancelado = {
      id: 22,
      fase: grupoA,
      equipoLocal: equipo1,
      equipoVisitante: equipo3,
      fechaHora: new Date(2026, 11, 7, 18, 0, 0),
      estado: EstadoPartido.CANCELADO,
      marcadorLocal: null,
      marcadorVisitante: null,
      ronda: null,
      numeroLlave: null,
    } as Partido;

    const partidoSemifinal = {
      id: 30,
      fase: faseFinal,
      equipoLocal: equipo1,
      equipoVisitante: equipo2,
      fechaHora: new Date(2026, 11, 15, 19, 0, 0),
      estado: EstadoPartido.FINALIZADO,
      marcadorLocal: 3,
      marcadorVisitante: 0,
      ronda: RondaFinal.SEMIFINAL,
      numeroLlave: 1,
    } as Partido;

    const partidoSemifinalCancelado = {
      id: 31,
      fase: faseFinal,
      equipoLocal: equipo2,
      equipoVisitante: equipo3,
      fechaHora: new Date(2026, 11, 15, 21, 0, 0),
      estado: EstadoPartido.CANCELADO,
      marcadorLocal: null,
      marcadorVisitante: null,
      ronda: RondaFinal.SEMIFINAL,
      numeroLlave: 2,
    } as Partido;

    partidoRepository.find.mockResolvedValue([
      partidoGrupoFinalizado,
      partidoGrupoProgramado,
      partidoGrupoCancelado,
      partidoSemifinal,
      partidoSemifinalCancelado,
    ]);

    const resultado = await service.obtenerDesarrollo(1);

    // Filtros estrictos por torneoId
    expect(torneoRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: { deporte: true },
    });
    expect(inscripcionRepository.countBy).toHaveBeenCalledWith({
      torneo: { id: 1 },
    });
    expect(faseRepository.find).toHaveBeenCalledWith({
      where: { torneo: { id: 1 } },
      order: { orden: 'ASC', nombre: 'ASC', id: 'ASC' },
    });

    // Resumen: 5 partidos totales, 2 con resultado, 1 pendiente (los 2 CANCELADO se excluyen de pendientes)
    expect(resultado.resumen).toEqual({
      totalPartidos: 5,
      conResultado: 2,
      pendientes: 1,
    });

    // Fases en orden: Grupo A, Grupo B (vacío), Fase final
    expect(resultado.fases).toHaveLength(3);

    const devGrupoA = resultado.fases[0];
    expect(devGrupoA.tipo).toBe(TipoFase.GRUPO);
    expect(devGrupoA.llaves).toBeNull();
    expect(devGrupoA.equipos?.map((e) => e.nombre)).toEqual([
      'América',
      'Deportes Pereira',
      'Once Caldas',
    ]);
    expect(devGrupoA.tablaPosiciones).toEqual([
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
      {
        posicion: 2,
        equipo: { id: 11, nombre: 'América', activo: true },
        jugados: 0,
        ganados: 0,
        empatados: 0,
        perdidos: 0,
        aFavor: 0,
        enContra: 0,
        diferencia: 0,
        puntos: 0,
      },
      {
        posicion: 3,
        equipo: { id: 9, nombre: 'Deportes Pereira', activo: true },
        jugados: 1,
        ganados: 0,
        empatados: 0,
        perdidos: 1,
        aFavor: 1,
        enContra: 2,
        diferencia: -1,
        puntos: 0,
      },
    ]);
    expect(devGrupoA.partidos).toHaveLength(3);
    expect(devGrupoA.partidos[0].tieneResultado).toBe(true);
    expect(devGrupoA.partidos[1].tieneResultado).toBe(false);

    // Grupo B sin equipos ni partidos
    const devGrupoB = resultado.fases[1];
    expect(devGrupoB.tipo).toBe(TipoFase.GRUPO);
    expect(devGrupoB.equipos).toEqual([]);
    expect(devGrupoB.tablaPosiciones).toEqual([]);
    expect(devGrupoB.llaves).toBeNull();
    expect(devGrupoB.partidos).toEqual([]);

    // Fase final con cuadro completo (SEMIFINAL, FINAL, TERCER_PUESTO) e ignorando partido CANCELADO en llave 2
    const devFaseFinal = resultado.fases[2];
    expect(devFaseFinal.tipo).toBe(TipoFase.FINAL);
    expect(devFaseFinal.equipos).toBeNull();
    expect(devFaseFinal.tablaPosiciones).toBeNull();
    expect(devFaseFinal.llaves?.map((r) => r.ronda)).toEqual([
      RondaFinal.SEMIFINAL,
      RondaFinal.FINAL,
      RondaFinal.TERCER_PUESTO,
    ]);
    expect(devFaseFinal.llaves?.[0].llaves[0].ganador).toEqual({
      id: 4,
      nombre: 'Once Caldas',
      activo: true,
    });
    expect(devFaseFinal.llaves?.[0].llaves[1]).toEqual({
      numeroLlave: 2,
      partido: null,
      ganador: null,
    });
    expect(devFaseFinal.partidos).toHaveLength(2);
  });

  it('no consulta grupo_equipo cuando el torneo solo tiene fase final', async () => {
    const faseFinal = crearFaseFinal(8, 'Fase final', 1, 2, false);

    torneoRepository.findOne.mockResolvedValue(crearTorneo());
    inscripcionRepository.countBy.mockResolvedValue(2);
    faseRepository.find.mockResolvedValue([faseFinal]);
    partidoRepository.find.mockResolvedValue([]);

    const resultado = await service.obtenerDesarrollo(1);

    expect(grupoEquipoRepository.find).not.toHaveBeenCalled();
    expect(resultado.fases).toHaveLength(1);
    expect(resultado.fases[0].tipo).toBe(TipoFase.FINAL);
    expect(resultado.fases[0].llaves).toEqual([
      {
        ronda: RondaFinal.FINAL,
        llaves: [{ numeroLlave: 1, partido: null, ganador: null }],
      },
    ]);
    expect(resultado.resumen).toEqual({
      totalPartidos: 0,
      conResultado: 0,
      pendientes: 0,
    });
  });

  it('cuenta correctamente partidos EN_JUEGO con marcador parcial como conResultado y sin marcador como pendientes', async () => {
    const grupoA = crearGrupo(3, 'Grupo A', 1);
    const equipo1 = { id: 4, nombre: 'Once Caldas', activo: true } as Equipo;
    const equipo2 = {
      id: 9,
      nombre: 'Deportes Pereira',
      activo: true,
    } as Equipo;

    torneoRepository.findOne.mockResolvedValue(crearTorneo());
    inscripcionRepository.countBy.mockResolvedValue(2);
    faseRepository.find.mockResolvedValue([grupoA]);
    grupoEquipoRepository.find.mockResolvedValue([
      { grupo: grupoA, equipo: equipo1 },
      { grupo: grupoA, equipo: equipo2 },
    ]);
    partidoRepository.find.mockResolvedValue([
      {
        id: 40,
        fase: grupoA,
        equipoLocal: equipo1,
        equipoVisitante: equipo2,
        fechaHora: new Date(2026, 11, 8, 16, 0, 0),
        estado: EstadoPartido.EN_JUEGO,
        marcadorLocal: 1,
        marcadorVisitante: 0,
        ronda: null,
        numeroLlave: null,
      } as Partido,
      {
        id: 41,
        fase: grupoA,
        equipoLocal: equipo2,
        equipoVisitante: equipo1,
        fechaHora: new Date(2026, 11, 9, 16, 0, 0),
        estado: EstadoPartido.EN_JUEGO,
        marcadorLocal: null,
        marcadorVisitante: null,
        ronda: null,
        numeroLlave: null,
      } as Partido,
    ]);

    const resultado = await service.obtenerDesarrollo(1);

    expect(resultado.resumen).toEqual({
      totalPartidos: 2,
      conResultado: 1,
      pendientes: 1,
    });
    // La tabla de posiciones solo cuenta partidos FINALIZADO
    expect(
      resultado.fases[0].tablaPosiciones?.every((f) => f.jugados === 0),
    ).toBe(true);
  });
});
