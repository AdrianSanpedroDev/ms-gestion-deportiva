// =====================================================================================
// TEMPORAL: quitar los jest.mock virtuales cuando A y C suban sus carpetas a main
// (common/errores, common/notificacion, equipo/, escenario/, torneo/ y fase/).
// Al quitarlos, importar las clases reales.
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
  '../common/notificacion/correo.service',
  () => ({ CorreoService: class CorreoService {} }),
  { virtual: true },
);
jest.mock(
  '../common/notificacion/destinatarios.service',
  () => ({ DestinatariosService: class DestinatariosService {} }),
  { virtual: true },
);
// Valores de EstadoTorneo según ACUERDOS 6.8.
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
// Clases REALES (no objetos sueltos) para que "fase instanceof Grupo / FaseFinal" funcione (ACUERDOS 6.11).
jest.mock(
  '../fase/entities/fase.entity',
  () => {
    class Fase {}
    class Grupo extends Fase {}
    class FaseFinal extends Fase {}
    return { Fase, Grupo, FaseFinal };
  },
  { virtual: true },
);
jest.mock(
  '../fase/entities/grupo-equipo.entity',
  () => ({ GrupoEquipo: class GrupoEquipo {} }),
  { virtual: true },
);
jest.mock(
  '../fase/entities/ronda-final.enum',
  () => ({
    RondaFinal: {
      DIECISEISAVOS: 'DIECISEISAVOS',
      OCTAVOS: 'OCTAVOS',
      CUARTOS: 'CUARTOS',
      SEMIFINAL: 'SEMIFINAL',
      FINAL: 'FINAL',
      TERCER_PUESTO: 'TERCER_PUESTO',
    },
  }),
  { virtual: true },
);
jest.mock(
  '../fase/entities/tipo-fase.enum',
  () => ({ TipoFase: { GRUPO: 'GRUPO', FINAL: 'FINAL' } }),
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

import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FindOperator, Not } from 'typeorm';
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
import { CorreoService } from '../common/notificacion/correo.service';
import { DestinatariosService } from '../common/notificacion/destinatarios.service';
import { Equipo } from '../equipo/entities/equipo.entity';
import { Escenario } from '../escenario/entities/escenario.entity';
import { Fase, FaseFinal, Grupo } from '../fase/entities/fase.entity';
import { GrupoEquipo } from '../fase/entities/grupo-equipo.entity';
import { RondaFinal } from '../fase/entities/ronda-final.enum';
import { EstadoTorneo } from '../torneo/entities/estado-torneo.enum';
import { Inscripcion } from '../torneo/entities/inscripcion.entity';
import { CrearPartidoDto } from './dto/crear-partido.dto';
import { Anotacion } from './entities/anotacion.entity';
import { EstadoPartido } from './entities/estado-partido.enum';
import { Partido } from './entities/partido.entity';
import { PartidoService } from './partido.service';
import { PartidoRepository } from './repositories/partido.repository';

// ------------------------------------------------------------------------------------
// Fixtures (se crean de nuevo en cada prueba: no se comparte estado entre pruebas)
// ------------------------------------------------------------------------------------
type Obj = Record<string, unknown>;

// Torneo del 1 al 20 de diciembre de 2026: los bordes de las pruebas de fecha salen de aquí.
const torneoBase = (extra: Obj = {}) => ({
  id: 1,
  nombre: 'Copa Caldas 2026',
  estado: EstadoTorneo.EN_CURSO,
  fechaInicio: '2026-12-01',
  fechaFin: '2026-12-20',
  ...extra,
});

const grupoBase = (extra: Obj = {}): Grupo =>
  Object.assign(new Grupo(), {
    id: 3,
    nombre: 'Grupo A',
    orden: 1,
    torneo: torneoBase(),
    ...extra,
  });

const faseFinalBase = (extra: Obj = {}): FaseFinal =>
  Object.assign(new FaseFinal(), {
    id: 5,
    nombre: 'Fase final',
    orden: 2,
    torneo: torneoBase(),
    cantidadEquipos: 8,
    tercerPuesto: false,
    ...extra,
  });

const equipoBase = (id: number, nombre: string, extra: Obj = {}): Equipo =>
  ({ id, nombre, activo: true, ...extra }) as unknown as Equipo;

const escenarioBase = (): Escenario =>
  ({ id: 1, nombre: 'Estadio Palogrande' }) as unknown as Escenario;

const dtoBase = (extra: Partial<CrearPartidoDto> = {}): CrearPartidoDto => ({
  equipoLocalId: 4,
  equipoVisitanteId: 9,
  fechaHora: '2026-12-05T15:30:00',
  escenarioId: 1,
  ronda: null,
  numeroLlave: null,
  ...extra,
});

const partidoBase = (extra: Obj = {}): Partido =>
  ({
    id: 20,
    fase: grupoBase(),
    equipoLocal: equipoBase(4, 'Once Caldas'),
    equipoVisitante: equipoBase(9, 'Deportes Pereira'),
    fechaHora: new Date(2026, 11, 5, 15, 30, 0),
    escenario: escenarioBase(),
    ronda: null,
    numeroLlave: null,
    estado: EstadoPartido.PROGRAMADO,
    marcadorLocal: null,
    marcadorVisitante: null,
    fechaCreacion: new Date(2026, 10, 1, 10, 0, 0),
    ...extra,
  }) as unknown as Partido;

async function esperarErrorCase(
  promesa: Promise<unknown>,
  errorCase: string,
): Promise<void> {
  await expect(promesa).rejects.toBeInstanceOf(ApplicationException);
  await expect(promesa).rejects.toMatchObject({ errorCase });
}

// Deja correr las promesas pendientes (el correo se envía SIN await, en segundo plano).
const vaciarPromesas = () => new Promise<void>((r) => setImmediate(r));

describe('PartidoService', () => {
  let service: PartidoService;

  const partidoRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    existsBy: jest.fn(),
    remove: jest.fn(),
  };
  const anotacionRepo = { countBy: jest.fn(), find: jest.fn() };
  const sqlRepo = { contarAnotacionesPorPartido: jest.fn() };
  const faseRepo = { findOne: jest.fn() };
  const grupoEquipoRepo = { existsBy: jest.fn() };
  const equipoRepo = { findOneBy: jest.fn() };
  const inscripcionRepo = { existsBy: jest.fn() };
  const escenarioRepo = { findOneBy: jest.fn() };
  const correo = { enviar: jest.fn() };
  const destinatarios = {
    aficionadosDeEquipos: jest.fn(),
    aficionadosDelPartido: jest.fn(),
  };

  // "Base de datos" de equipos: una prueba puede poner null (no existe) o inactivo.
  let equiposBD: Record<number, Equipo | null>;

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    equiposBD = {
      4: equipoBase(4, 'Once Caldas'),
      9: equipoBase(9, 'Deportes Pereira'),
    };
    equipoRepo.findOneBy.mockImplementation(({ id }: { id: number }) =>
      Promise.resolve(equiposBD[id] ?? null),
    );
    escenarioRepo.findOneBy.mockResolvedValue(escenarioBase());
    faseRepo.findOne.mockResolvedValue(grupoBase());
    inscripcionRepo.existsBy.mockResolvedValue(true);
    grupoEquipoRepo.existsBy.mockResolvedValue(true);

    // Como TypeORM: create no toca la BD y save completa el id SOBRE el mismo objeto.
    partidoRepo.create.mockImplementation((d: Obj) => ({ ...d }));
    partidoRepo.save.mockImplementation((p: Obj) => {
      p.id = p.id ?? 20;
      return Promise.resolve(p);
    });
    partidoRepo.existsBy.mockResolvedValue(false);
    partidoRepo.find.mockResolvedValue([]);
    partidoRepo.remove.mockResolvedValue(undefined);
    anotacionRepo.countBy.mockResolvedValue(0);
    anotacionRepo.find.mockResolvedValue([]);
    sqlRepo.contarAnotacionesPorPartido.mockResolvedValue(new Map());
    correo.enviar.mockReturnValue(undefined);
    destinatarios.aficionadosDeEquipos.mockResolvedValue(['a@gmail.com']);
    destinatarios.aficionadosDelPartido.mockResolvedValue(['a@gmail.com']);

    const modulo = await Test.createTestingModule({
      providers: [
        PartidoService,
        { provide: getRepositoryToken(Partido), useValue: partidoRepo },
        { provide: getRepositoryToken(Anotacion), useValue: anotacionRepo },
        { provide: PartidoRepository, useValue: sqlRepo },
        { provide: getRepositoryToken(Fase), useValue: faseRepo },
        { provide: getRepositoryToken(GrupoEquipo), useValue: grupoEquipoRepo },
        { provide: getRepositoryToken(Equipo), useValue: equipoRepo },
        { provide: getRepositoryToken(Inscripcion), useValue: inscripcionRepo },
        { provide: getRepositoryToken(Escenario), useValue: escenarioRepo },
        { provide: CorreoService, useValue: correo },
        { provide: DestinatariosService, useValue: destinatarios },
      ],
    }).compile();
    service = modulo.get(PartidoService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==================================================================================
  describe('crear', () => {
    // Rechaza con el ErrorCase y no guarda ni envía correo.
    async function rechaza(promesa: Promise<unknown>, errorCase: string) {
      await esperarErrorCase(promesa, errorCase);
      expect(partidoRepo.save).not.toHaveBeenCalled();
      expect(destinatarios.aficionadosDeEquipos).not.toHaveBeenCalled();
    }

    describe('existencia (404)', () => {
      it('lanza NOT_FOUND si la fase no existe', async () => {
        faseRepo.findOne.mockResolvedValue(null);
        await rechaza(service.crear(3, dtoBase()), ErrorCase.NOT_FOUND);
      });

      it('lanza NOT_FOUND si el equipo local no existe', async () => {
        equiposBD[4] = null;
        await rechaza(service.crear(3, dtoBase()), ErrorCase.NOT_FOUND);
      });

      it('lanza NOT_FOUND si el equipo visitante no existe', async () => {
        equiposBD[9] = null;
        await rechaza(service.crear(3, dtoBase()), ErrorCase.NOT_FOUND);
      });

      it('lanza NOT_FOUND si el escenario no existe', async () => {
        escenarioRepo.findOneBy.mockResolvedValue(null);
        await rechaza(service.crear(3, dtoBase()), ErrorCase.NOT_FOUND);
      });

      it('el 404 de la fase gana aunque el body también tenga un 400 (local = visitante)', async () => {
        faseRepo.findOne.mockResolvedValue(null);
        await rechaza(
          service.crear(3, dtoBase({ equipoVisitanteId: 4 })),
          ErrorCase.NOT_FOUND,
        );
      });

      it('el 404 del escenario gana aunque haya un 400 (torneo FINALIZADO)', async () => {
        faseRepo.findOne.mockResolvedValue(
          grupoBase({
            torneo: torneoBase({ estado: EstadoTorneo.FINALIZADO }),
          }),
        );
        escenarioRepo.findOneBy.mockResolvedValue(null);
        await rechaza(service.crear(3, dtoBase()), ErrorCase.NOT_FOUND);
      });

      it('el 404 del equipo visitante gana aunque el local esté inactivo (400)', async () => {
        equiposBD[4] = equipoBase(4, 'Once Caldas', { activo: false });
        equiposBD[9] = null;
        await rechaza(service.crear(3, dtoBase()), ErrorCase.NOT_FOUND);
      });

      it('busca la fase por id (con su torneo) y no consulta escenario si no vino escenarioId', async () => {
        await service.crear(3, dtoBase({ escenarioId: null }));
        expect(faseRepo.findOne).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 3 },
            relations: expect.objectContaining({ torneo: true }),
          }),
        );
        expect(escenarioRepo.findOneBy).not.toHaveBeenCalled();
      });
    });

    describe('reglas de equipos (400)', () => {
      it('lanza INVALID_OPERATION si el equipo local es igual al visitante', async () => {
        await rechaza(
          service.crear(3, dtoBase({ equipoVisitanteId: 4 })),
          ErrorCase.INVALID_OPERATION,
        );
      });

      it('lanza INVALID_OPERATION si el equipo local está inactivo', async () => {
        equiposBD[4] = equipoBase(4, 'Once Caldas', { activo: false });
        await rechaza(service.crear(3, dtoBase()), ErrorCase.INVALID_OPERATION);
      });

      it('lanza INVALID_OPERATION si el equipo visitante está inactivo', async () => {
        equiposBD[9] = equipoBase(9, 'Deportes Pereira', { activo: false });
        await rechaza(service.crear(3, dtoBase()), ErrorCase.INVALID_OPERATION);
      });

      it('lanza INVALID_OPERATION si el equipo local no está inscrito en el torneo', async () => {
        inscripcionRepo.existsBy.mockImplementation(
          (w: { equipo: { id: number } }) => Promise.resolve(w.equipo.id !== 4),
        );
        await rechaza(service.crear(3, dtoBase()), ErrorCase.INVALID_OPERATION);
      });

      it('lanza INVALID_OPERATION si el equipo visitante no está inscrito en el torneo', async () => {
        inscripcionRepo.existsBy.mockImplementation(
          (w: { equipo: { id: number } }) => Promise.resolve(w.equipo.id !== 9),
        );
        await rechaza(service.crear(3, dtoBase()), ErrorCase.INVALID_OPERATION);
      });

      it('consulta la inscripción con el torneo de la fase y el id del equipo', async () => {
        await service.crear(3, dtoBase());
        expect(inscripcionRepo.existsBy).toHaveBeenCalledWith({
          torneo: { id: 1 },
          equipo: { id: 4 },
        });
        expect(inscripcionRepo.existsBy).toHaveBeenCalledWith({
          torneo: { id: 1 },
          equipo: { id: 9 },
        });
      });
    });

    describe('estado del torneo (400)', () => {
      it.each([
        EstadoTorneo.INSCRIPCIONES_ABIERTAS,
        EstadoTorneo.FINALIZADO,
        EstadoTorneo.CANCELADO,
      ])('lanza INVALID_OPERATION si el torneo está %s', async (estado) => {
        faseRepo.findOne.mockResolvedValue(
          grupoBase({ torneo: torneoBase({ estado }) }),
        );
        await rechaza(service.crear(3, dtoBase()), ErrorCase.INVALID_OPERATION);
      });

      it.each([EstadoTorneo.INSCRIPCIONES_CERRADAS, EstadoTorneo.EN_CURSO])(
        'permite crear si el torneo está %s',
        async (estado) => {
          faseRepo.findOne.mockResolvedValue(
            grupoBase({ torneo: torneoBase({ estado }) }),
          );
          await expect(service.crear(3, dtoBase())).resolves.toBeDefined();
          expect(partidoRepo.save).toHaveBeenCalledTimes(1);
        },
      );
    });

    describe('fecha dentro del torneo (1 al 20 de diciembre)', () => {
      it('el PRIMER día del torneo vale (>=, a las 00:00)', async () => {
        await expect(
          service.crear(3, dtoBase({ fechaHora: '2026-12-01T00:00:00' })),
        ).resolves.toBeDefined();
      });

      it('el ÚLTIMO día del torneo vale aunque la hora no sea 00:00 (<=, sin comparar el texto largo)', async () => {
        await expect(
          service.crear(3, dtoBase({ fechaHora: '2026-12-20T23:59:59' })),
        ).resolves.toBeDefined();
        expect(partidoRepo.save).toHaveBeenCalledTimes(1);
      });

      it('lanza INVALID_OPERATION un día ANTES del inicio del torneo', async () => {
        await rechaza(
          service.crear(3, dtoBase({ fechaHora: '2026-11-30T23:59:59' })),
          ErrorCase.INVALID_OPERATION,
        );
      });

      it('lanza INVALID_OPERATION un día DESPUÉS del fin del torneo', async () => {
        await rechaza(
          service.crear(3, dtoBase({ fechaHora: '2026-12-21T00:00:00' })),
          ErrorCase.INVALID_OPERATION,
        );
      });
    });

    describe('fase de tipo Grupo', () => {
      it('lanza INVALID_OPERATION si trae ronda', async () => {
        await rechaza(
          service.crear(3, dtoBase({ ronda: RondaFinal.FINAL })),
          ErrorCase.INVALID_OPERATION,
        );
      });

      it('lanza INVALID_OPERATION si trae numeroLlave', async () => {
        await rechaza(
          service.crear(3, dtoBase({ numeroLlave: 1 })),
          ErrorCase.INVALID_OPERATION,
        );
      });

      it('lanza INVALID_OPERATION si el equipo local no pertenece al grupo', async () => {
        grupoEquipoRepo.existsBy.mockImplementation(
          (w: { equipo: { id: number } }) => Promise.resolve(w.equipo.id !== 4),
        );
        await rechaza(service.crear(3, dtoBase()), ErrorCase.INVALID_OPERATION);
      });

      it('lanza INVALID_OPERATION si el equipo visitante no pertenece al grupo', async () => {
        grupoEquipoRepo.existsBy.mockImplementation(
          (w: { equipo: { id: number } }) => Promise.resolve(w.equipo.id !== 9),
        );
        await rechaza(service.crear(3, dtoBase()), ErrorCase.INVALID_OPERATION);
      });

      it('comprueba la pertenencia con el id del grupo y el id de cada equipo', async () => {
        await service.crear(3, dtoBase());
        expect(grupoEquipoRepo.existsBy).toHaveBeenCalledWith({
          grupo: { id: 3 },
          equipo: { id: 4 },
        });
        expect(grupoEquipoRepo.existsBy).toHaveBeenCalledWith({
          grupo: { id: 3 },
          equipo: { id: 9 },
        });
      });

      it('en un grupo NO consulta llaves ocupadas del partido', async () => {
        await service.crear(3, dtoBase());
        expect(partidoRepo.existsBy).not.toHaveBeenCalled();
      });
    });

    describe('fase de tipo FaseFinal (8 equipos, sin tercer puesto)', () => {
      beforeEach(() => {
        faseRepo.findOne.mockResolvedValue(faseFinalBase());
      });

      const dtoFinal = (extra: Partial<CrearPartidoDto> = {}) =>
        dtoBase({ ronda: RondaFinal.CUARTOS, numeroLlave: 1, ...extra });

      it('lanza INVALID_OPERATION si falta la ronda', async () => {
        await rechaza(
          service.crear(5, dtoFinal({ ronda: null })),
          ErrorCase.INVALID_OPERATION,
        );
      });

      it('lanza INVALID_OPERATION si falta el numeroLlave', async () => {
        await rechaza(
          service.crear(5, dtoFinal({ numeroLlave: null })),
          ErrorCase.INVALID_OPERATION,
        );
      });

      it('lanza INVALID_OPERATION si la ronda no existe para la cantidad de equipos (OCTAVOS en una fase de 8)', async () => {
        await rechaza(
          service.crear(5, dtoFinal({ ronda: RondaFinal.OCTAVOS })),
          ErrorCase.INVALID_OPERATION,
        );
      });

      it('lanza INVALID_OPERATION con TERCER_PUESTO si la fase no tiene tercerPuesto', async () => {
        await rechaza(
          service.crear(5, dtoFinal({ ronda: RondaFinal.TERCER_PUESTO })),
          ErrorCase.INVALID_OPERATION,
        );
      });

      it('permite TERCER_PUESTO llave 1 si la fase tiene tercerPuesto', async () => {
        faseRepo.findOne.mockResolvedValue(
          faseFinalBase({ tercerPuesto: true }),
        );
        await expect(
          service.crear(
            5,
            dtoFinal({ ronda: RondaFinal.TERCER_PUESTO, numeroLlave: 1 }),
          ),
        ).resolves.toBeDefined();
      });

      it('lanza INVALID_OPERATION si la llave se pasa del rango (CUARTOS tiene 4 llaves: la 5 no existe)', async () => {
        await rechaza(
          service.crear(5, dtoFinal({ numeroLlave: 5 })),
          ErrorCase.INVALID_OPERATION,
        );
      });

      it('acepta la ÚLTIMA llave del rango (CUARTOS llave 4)', async () => {
        await expect(
          service.crear(5, dtoFinal({ numeroLlave: 4 })),
        ).resolves.toBeDefined();
      });

      it('lanza ALREADY_EXISTS si la llave ya está ocupada por un partido no cancelado', async () => {
        partidoRepo.existsBy.mockResolvedValue(true);
        await rechaza(service.crear(5, dtoFinal()), ErrorCase.ALREADY_EXISTS);
      });

      it('busca la llave por fase + ronda + numeroLlave y excluye los CANCELADOS', async () => {
        await service.crear(5, dtoFinal());
        const where = partidoRepo.existsBy.mock.calls[0][0];
        expect(where.fase).toEqual({ id: 5 });
        expect(where.ronda).toBe(RondaFinal.CUARTOS);
        expect(where.numeroLlave).toBe(1);
        expect(where.estado).toBeInstanceOf(FindOperator);
        expect(where.estado.type).toBe('not');
        expect(where.estado.value).toBe(EstadoPartido.CANCELADO);
      });

      describe('con un repositorio que SÍ respeta el filtro de estado', () => {
        // Repositorio simulado con una llave ya usada: evalúa ronda, llave y el Not(estado) del where.
        const simularLlaveUsadaPor = (estado: EstadoPartido) => {
          partidoRepo.existsBy.mockImplementation((w: Obj) => {
            const filtro = w.estado as FindOperator<EstadoPartido> | undefined;
            const estadoCoincide =
              filtro instanceof FindOperator && filtro.type === 'not'
                ? estado !== filtro.value
                : true;
            return Promise.resolve(
              w.ronda === RondaFinal.CUARTOS &&
                w.numeroLlave === 1 &&
                estadoCoincide,
            );
          });
        };

        it('llave ocupada por un partido PROGRAMADO → ALREADY_EXISTS', async () => {
          simularLlaveUsadaPor(EstadoPartido.PROGRAMADO);
          await rechaza(service.crear(5, dtoFinal()), ErrorCase.ALREADY_EXISTS);
        });

        it('llave ocupada por un partido CANCELADO → sí deja crear', async () => {
          simularLlaveUsadaPor(EstadoPartido.CANCELADO);
          await expect(service.crear(5, dtoFinal())).resolves.toBeDefined();
          expect(partidoRepo.save).toHaveBeenCalledTimes(1);
        });
      });

      it('en la fase final NO exige pertenencia a un grupo', async () => {
        await service.crear(5, dtoFinal());
        expect(grupoEquipoRepo.existsBy).not.toHaveBeenCalled();
      });

      it('el caso feliz devuelve ronda y llave en la respuesta y tipo FINAL', async () => {
        const r = await service.crear(5, dtoFinal());
        expect(r.ronda).toBe('CUARTOS');
        expect(r.numeroLlave).toBe(1);
        expect(r.fase).toMatchObject({ id: 5, tipo: 'FINAL' });
      });
    });

    describe('caso feliz', () => {
      it('guarda con estado PROGRAMADO y sin marcadores, y devuelve el PartidoResponse de 9.10', async () => {
        const r = await service.crear(3, dtoBase());

        expect(partidoRepo.save).toHaveBeenCalledTimes(1);
        const guardado = partidoRepo.save.mock.calls[0][0];
        expect(guardado.estado).toBe(EstadoPartido.PROGRAMADO);
        expect(guardado.marcadorLocal).toBeNull();
        expect(guardado.marcadorVisitante).toBeNull();

        expect(r).toEqual({
          id: 20,
          torneo: { id: 1, nombre: 'Copa Caldas 2026', estado: 'EN_CURSO' },
          fase: { id: 3, nombre: 'Grupo A', tipo: 'GRUPO', orden: 1 },
          equipoLocal: { id: 4, nombre: 'Once Caldas', activo: true },
          equipoVisitante: { id: 9, nombre: 'Deportes Pereira', activo: true },
          fechaHora: '2026-12-05T15:30:00',
          escenario: { id: 1, nombre: 'Estadio Palogrande' },
          ronda: null,
          numeroLlave: null,
          estado: 'PROGRAMADO',
          marcadorLocal: null,
          marcadorVisitante: null,
          tieneResultado: false,
          cantidadAnotaciones: 0,
        });
      });

      it('sin escenarioId guarda el partido con escenario null', async () => {
        const r = await service.crear(3, dtoBase({ escenarioId: null }));
        expect(partidoRepo.save.mock.calls[0][0].escenario).toBeNull();
        expect(r.escenario).toBeNull();
      });

      it('no devuelve una instancia de la entidad Partido', async () => {
        const r = await service.crear(3, dtoBase());
        expect(r).not.toBeInstanceOf(Partido);
      });
    });

    describe('correo "Nuevo partido" (ACUERDOS 8)', () => {
      it('se llama DESPUÉS de guardar (save antes que destinatarios y envío)', async () => {
        await service.crear(3, dtoBase());
        await vaciarPromesas();

        expect(destinatarios.aficionadosDeEquipos).toHaveBeenCalledWith(4, 9);
        expect(correo.enviar).toHaveBeenCalledTimes(1);

        const ordenSave = partidoRepo.save.mock.invocationCallOrder[0];
        const ordenDestinatarios =
          destinatarios.aficionadosDeEquipos.mock.invocationCallOrder[0];
        const ordenEnvio = correo.enviar.mock.invocationCallOrder[0];
        expect(ordenSave).toBeLessThan(ordenDestinatarios);
        expect(ordenSave).toBeLessThan(ordenEnvio);
      });

      it('envía a los destinatarios con el asunto "Nuevo partido: {local} vs {visitante}"', async () => {
        await service.crear(3, dtoBase());
        await vaciarPromesas();

        const [para, asunto, html] = correo.enviar.mock.calls[0];
        expect(para).toEqual(['a@gmail.com']);
        expect(asunto).toBe('Nuevo partido: Once Caldas vs Deportes Pereira');
        expect(html).toContain('Copa Caldas 2026');
        expect(html).toContain('Grupo A');
        expect(html).toContain('Estadio Palogrande');
      });

      it('no envía correo si la validación falla', async () => {
        await service
          .crear(3, dtoBase({ equipoVisitanteId: 4 }))
          .catch(() => undefined);
        await vaciarPromesas();
        expect(correo.enviar).not.toHaveBeenCalled();
      });

      it('si el envío del correo falla, crear responde bien igual', async () => {
        correo.enviar.mockImplementation(() => {
          throw new Error('ms-notifications caído');
        });
        await expect(service.crear(3, dtoBase())).resolves.toMatchObject({
          id: 20,
          estado: 'PROGRAMADO',
        });
        await vaciarPromesas();
        expect(partidoRepo.save).toHaveBeenCalledTimes(1);
      });

      it('si los destinatarios rechazan, crear responde bien igual (y no queda promesa sin atrapar)', async () => {
        destinatarios.aficionadosDeEquipos.mockRejectedValue(
          new Error('falló la consulta'),
        );
        await expect(service.crear(3, dtoBase())).resolves.toMatchObject({
          id: 20,
        });
        await vaciarPromesas();
        expect(correo.enviar).not.toHaveBeenCalled();
      });
    });
  });

  // ==================================================================================
  describe('listar', () => {
    it('sin filtros no mete claves undefined en el where', async () => {
      await service.listar({});
      const { where } = partidoRepo.find.mock.calls[0][0];
      expect(where).toStrictEqual({});
    });

    it('con filtros vacíos (undefined) tampoco mete claves en el where', async () => {
      await service.listar({
        torneoId: undefined,
        equipoId: undefined,
        estado: undefined,
      });
      const { where } = partidoRepo.find.mock.calls[0][0];
      expect(where).toStrictEqual({});
    });

    it('ordena por fechaHora ASC', async () => {
      await service.listar({});
      expect(partidoRepo.find.mock.calls[0][0].order).toEqual({
        fechaHora: 'ASC',
        id: 'ASC', // desempata dos partidos a la misma hora
      });
    });

    it('con torneoId filtra por el torneo de la fase (el partido no tiene torneo_id)', async () => {
      await service.listar({ torneoId: 1 });
      expect(partidoRepo.find.mock.calls[0][0].where).toEqual({
        fase: { torneo: { id: 1 } },
      });
    });

    it('con estado filtra por estado', async () => {
      await service.listar({ estado: EstadoPartido.EN_JUEGO });
      expect(partidoRepo.find.mock.calls[0][0].where).toEqual({
        estado: EstadoPartido.EN_JUEGO,
      });
    });

    it('con equipoId el where es un arreglo OR: local o visitante', async () => {
      await service.listar({ equipoId: 4 });
      const { where } = partidoRepo.find.mock.calls[0][0];
      expect(Array.isArray(where)).toBe(true);
      expect(where).toStrictEqual([
        { equipoLocal: { id: 4 } },
        { equipoVisitante: { id: 4 } },
      ]);
    });

    it('con equipoId y otros filtros, CADA rama del OR repite los otros filtros', async () => {
      await service.listar({
        equipoId: 4,
        torneoId: 1,
        estado: EstadoPartido.PROGRAMADO,
      });
      const { where } = partidoRepo.find.mock.calls[0][0];
      expect(where).toHaveLength(2);
      expect(where).toEqual([
        {
          fase: { torneo: { id: 1 } },
          estado: EstadoPartido.PROGRAMADO,
          equipoLocal: { id: 4 },
        },
        {
          fase: { torneo: { id: 1 } },
          estado: EstadoPartido.PROGRAMADO,
          equipoVisitante: { id: 4 },
        },
      ]);
    });

    it('trae las relaciones que necesita el response (fase con torneo, equipos y escenario)', async () => {
      await service.listar({});
      expect(partidoRepo.find.mock.calls[0][0].relations).toEqual({
        fase: { torneo: true },
        equipoLocal: true,
        equipoVisitante: true,
        escenario: true,
      });
    });

    it('devuelve DTOs con cantidadAnotaciones del conteo agrupado (0 si el partido no aparece)', async () => {
      partidoRepo.find.mockResolvedValue([
        partidoBase({ id: 20 }),
        partidoBase({ id: 21 }),
      ]);
      sqlRepo.contarAnotacionesPorPartido.mockResolvedValue(new Map([[20, 3]]));

      const r = await service.listar({});

      expect(sqlRepo.contarAnotacionesPorPartido).toHaveBeenCalledWith([
        20, 21,
      ]);
      expect(r).toHaveLength(2);
      expect(r[0]).not.toBeInstanceOf(Partido);
      expect(r[0].cantidadAnotaciones).toBe(3);
      expect(r[1].cantidadAnotaciones).toBe(0);
    });
  });

  // ==================================================================================
  describe('listarPorFase', () => {
    it('lanza NOT_FOUND si la fase no existe (no responde [])', async () => {
      faseRepo.findOne.mockResolvedValue(null);
      await esperarErrorCase(
        service.listarPorFase(99, {}),
        ErrorCase.NOT_FOUND,
      );
      expect(partidoRepo.find).not.toHaveBeenCalled();
    });

    it('filtra por la fase y por estado cuando viene', async () => {
      await service.listarPorFase(3, { estado: EstadoPartido.PROGRAMADO });
      const opciones = partidoRepo.find.mock.calls[0][0];
      expect(opciones.where).toEqual({
        fase: { id: 3 },
        estado: EstadoPartido.PROGRAMADO,
      });
      expect(opciones.order).toEqual({ fechaHora: 'ASC', id: 'ASC' });
    });

    it('sin estado no mete la clave estado en el where', async () => {
      await service.listarPorFase(3, {});
      expect(partidoRepo.find.mock.calls[0][0].where).toStrictEqual({
        fase: { id: 3 },
      });
    });
  });

  // ==================================================================================
  describe('obtener', () => {
    it('lanza NOT_FOUND si el partido no existe (findOne devuelve null)', async () => {
      partidoRepo.findOne.mockResolvedValue(null);
      await esperarErrorCase(service.obtener(99), ErrorCase.NOT_FOUND);
    });

    it('devuelve el DTO con la cantidad de anotaciones', async () => {
      partidoRepo.findOne.mockResolvedValue(partidoBase());
      anotacionRepo.countBy.mockResolvedValue(2);
      const r = await service.obtener(20);
      expect(r.id).toBe(20);
      expect(r.cantidadAnotaciones).toBe(2);
      expect(r).not.toBeInstanceOf(Partido);
    });
  });

  // ==================================================================================
  describe('actualizar', () => {
    it('lanza NOT_FOUND si el partido no existe', async () => {
      partidoRepo.findOne.mockResolvedValue(null);
      await esperarErrorCase(
        service.actualizar(99, dtoBase()),
        ErrorCase.NOT_FOUND,
      );
      expect(partidoRepo.save).not.toHaveBeenCalled();
    });

    it.each([
      EstadoPartido.EN_JUEGO,
      EstadoPartido.FINALIZADO,
      EstadoPartido.CANCELADO,
    ])(
      'lanza INVALID_OPERATION si el partido está %s (solo se edita PROGRAMADO)',
      async (estado) => {
        partidoRepo.findOne.mockResolvedValue(partidoBase({ estado }));
        await esperarErrorCase(
          service.actualizar(20, dtoBase()),
          ErrorCase.INVALID_OPERATION,
        );
        expect(partidoRepo.save).not.toHaveBeenCalled();
      },
    );

    it('lanza NOT_FOUND si el nuevo equipo local no existe', async () => {
      partidoRepo.findOne.mockResolvedValue(partidoBase());
      equiposBD[4] = null;
      await esperarErrorCase(
        service.actualizar(20, dtoBase()),
        ErrorCase.NOT_FOUND,
      );
    });

    it('aplica las mismas reglas que crear: local = visitante → INVALID_OPERATION', async () => {
      partidoRepo.findOne.mockResolvedValue(partidoBase());
      await esperarErrorCase(
        service.actualizar(20, dtoBase({ equipoVisitanteId: 4 })),
        ErrorCase.INVALID_OPERATION,
      );
      expect(partidoRepo.save).not.toHaveBeenCalled();
    });

    it('aplica la regla de fechas: fuera del torneo → INVALID_OPERATION', async () => {
      partidoRepo.findOne.mockResolvedValue(partidoBase());
      await esperarErrorCase(
        service.actualizar(20, dtoBase({ fechaHora: '2026-12-21T10:00:00' })),
        ErrorCase.INVALID_OPERATION,
      );
    });

    // 6.12: el estado del torneo solo se exige al CREAR; editar un PROGRAMADO no lo mira.
    it.each([
      EstadoTorneo.INSCRIPCIONES_ABIERTAS,
      EstadoTorneo.INSCRIPCIONES_CERRADAS,
      EstadoTorneo.EN_CURSO,
    ])(
      'permite editar un partido PROGRAMADO con el torneo en %s (la regla del torneo es solo de crear)',
      async (estado) => {
        partidoRepo.findOne.mockResolvedValue(
          partidoBase({ fase: grupoBase({ torneo: torneoBase({ estado }) }) }),
        );
        await expect(service.actualizar(20, dtoBase())).resolves.toMatchObject({
          id: 20,
        });
        expect(partidoRepo.save).toHaveBeenCalledTimes(1);
      },
    );

    it('escenarioId: null quita el escenario del partido', async () => {
      partidoRepo.findOne.mockResolvedValue(partidoBase());
      const r = await service.actualizar(20, dtoBase({ escenarioId: null }));
      expect(escenarioRepo.findOneBy).not.toHaveBeenCalled();
      expect(partidoRepo.save).toHaveBeenCalledTimes(1);
      expect(partidoRepo.save.mock.calls[0][0].escenario).toBeNull();
      expect(r.escenario).toBeNull();
    });

    it('guarda los cambios (save) y devuelve el DTO con la fecha nueva', async () => {
      partidoRepo.findOne.mockResolvedValue(partidoBase());
      const r = await service.actualizar(
        20,
        dtoBase({ fechaHora: '2026-12-10T18:00:00' }),
      );
      expect(partidoRepo.save).toHaveBeenCalledTimes(1);
      expect(r.id).toBe(20);
      expect(r.fechaHora).toBe('2026-12-10T18:00:00');
      expect(r.estado).toBe('PROGRAMADO');
    });

    it('en la fase final, la llave se busca excluyendo al propio partido (Not(id))', async () => {
      partidoRepo.findOne.mockResolvedValue(
        partidoBase({
          fase: faseFinalBase(),
          ronda: RondaFinal.CUARTOS,
          numeroLlave: 1,
        }),
      );
      await service.actualizar(
        20,
        dtoBase({ ronda: RondaFinal.CUARTOS, numeroLlave: 1 }),
      );
      const where = partidoRepo.existsBy.mock.calls[0][0];
      expect(where.id).toEqual(Not(20));
    });
  });

  // ==================================================================================
  describe('cambiarEstado', () => {
    const E = EstadoPartido;
    const conResultado = (estado: EstadoPartido) =>
      partidoBase({ estado, marcadorLocal: 2, marcadorVisitante: 1 });

    it('lanza NOT_FOUND si el partido no existe', async () => {
      partidoRepo.findOne.mockResolvedValue(null);
      await esperarErrorCase(
        service.cambiarEstado(99, E.EN_JUEGO),
        ErrorCase.NOT_FOUND,
      );
    });

    // Matriz completa de ACUERDOS 6.12.
    it.each([
      [E.PROGRAMADO, E.EN_JUEGO],
      [E.PROGRAMADO, E.CANCELADO],
      [E.EN_JUEGO, E.FINALIZADO],
      [E.EN_JUEGO, E.CANCELADO],
    ])('permite la transición %s → %s', async (actual, nuevo) => {
      partidoRepo.findOne.mockResolvedValue(conResultado(actual));
      const r = await service.cambiarEstado(20, nuevo);
      expect(r.estado).toBe(nuevo);
      expect(partidoRepo.save).toHaveBeenCalledTimes(1);
    });

    it.each([
      [E.PROGRAMADO, E.PROGRAMADO],
      [E.PROGRAMADO, E.FINALIZADO],
      [E.EN_JUEGO, E.PROGRAMADO],
      [E.EN_JUEGO, E.EN_JUEGO],
      [E.FINALIZADO, E.PROGRAMADO],
      [E.FINALIZADO, E.EN_JUEGO],
      [E.FINALIZADO, E.FINALIZADO],
      [E.FINALIZADO, E.CANCELADO],
      [E.CANCELADO, E.PROGRAMADO],
      [E.CANCELADO, E.EN_JUEGO],
      [E.CANCELADO, E.FINALIZADO],
      [E.CANCELADO, E.CANCELADO],
    ])(
      'rechaza la transición %s → %s con INVALID_OPERATION y no guarda',
      async (actual, nuevo) => {
        partidoRepo.findOne.mockResolvedValue(conResultado(actual));
        await esperarErrorCase(
          service.cambiarEstado(20, nuevo),
          ErrorCase.INVALID_OPERATION,
        );
        expect(partidoRepo.save).not.toHaveBeenCalled();
      },
    );

    it('el mensaje de una transición inválida nombra los DOS estados', async () => {
      partidoRepo.findOne.mockResolvedValue(conResultado(E.FINALIZADO));
      const promesa = service.cambiarEstado(20, E.EN_JUEGO);
      await expect(promesa).rejects.toThrow(/FINALIZADO/);
      await expect(promesa).rejects.toThrow(/EN_JUEGO/);
    });

    it('FINALIZADO sin marcadores → INVALID_OPERATION', async () => {
      partidoRepo.findOne.mockResolvedValue(
        partidoBase({ estado: E.EN_JUEGO }),
      );
      await esperarErrorCase(
        service.cambiarEstado(20, E.FINALIZADO),
        ErrorCase.INVALID_OPERATION,
      );
      expect(partidoRepo.save).not.toHaveBeenCalled();
    });

    it('FINALIZADO con solo un marcador → INVALID_OPERATION', async () => {
      partidoRepo.findOne.mockResolvedValue(
        partidoBase({
          estado: E.EN_JUEGO,
          marcadorLocal: 2,
          marcadorVisitante: null,
        }),
      );
      await esperarErrorCase(
        service.cambiarEstado(20, E.FINALIZADO),
        ErrorCase.INVALID_OPERATION,
      );
    });

    it('FINALIZADO con marcadores pasa, y un 0-0 también cuenta como resultado', async () => {
      partidoRepo.findOne.mockResolvedValue(
        partidoBase({
          estado: E.EN_JUEGO,
          marcadorLocal: 0,
          marcadorVisitante: 0,
        }),
      );
      const r = await service.cambiarEstado(20, E.FINALIZADO);
      expect(r.estado).toBe('FINALIZADO');
      expect(r.tieneResultado).toBe(true);
      expect(partidoRepo.save).toHaveBeenCalledTimes(1);
    });

    it('CANCELADO no exige resultado', async () => {
      partidoRepo.findOne.mockResolvedValue(
        partidoBase({ estado: E.EN_JUEGO }),
      );
      await expect(
        service.cambiarEstado(20, E.CANCELADO),
      ).resolves.toMatchObject({ estado: 'CANCELADO' });
    });

    describe('correo de resumen (ACUERDOS 8)', () => {
      it('al FINALIZAR envía "Resumen: {local} {m1} - {m2} {visitante}" a aficionadosDelPartido, DESPUÉS de guardar', async () => {
        partidoRepo.findOne.mockResolvedValue(conResultado(E.EN_JUEGO));
        await service.cambiarEstado(20, E.FINALIZADO);
        await vaciarPromesas();

        expect(destinatarios.aficionadosDelPartido).toHaveBeenCalledWith(20);
        expect(correo.enviar).toHaveBeenCalledTimes(1);
        const [para, asunto] = correo.enviar.mock.calls[0];
        expect(para).toEqual(['a@gmail.com']);
        expect(asunto).toBe('Resumen: Once Caldas 2 - 1 Deportes Pereira');
        expect(partidoRepo.save.mock.invocationCallOrder[0]).toBeLessThan(
          correo.enviar.mock.invocationCallOrder[0],
        );
      });

      it('al pasar a EN_JUEGO no envía correo', async () => {
        partidoRepo.findOne.mockResolvedValue(partidoBase());
        await service.cambiarEstado(20, E.EN_JUEGO);
        await vaciarPromesas();
        expect(correo.enviar).not.toHaveBeenCalled();
      });

      it('si la LECTURA de las anotaciones falla, finalizar responde igual y el error queda en el log', async () => {
        partidoRepo.findOne.mockResolvedValue(conResultado(E.EN_JUEGO));
        anotacionRepo.find.mockRejectedValue(new Error('BD caída'));
        await expect(
          service.cambiarEstado(20, E.FINALIZADO),
        ).resolves.toMatchObject({ estado: 'FINALIZADO' });
        await vaciarPromesas();

        expect(partidoRepo.save).toHaveBeenCalledTimes(1);
        expect(correo.enviar).not.toHaveBeenCalled();
        expect(Logger.prototype.error).toHaveBeenCalledWith(
          expect.stringContaining('BD caída'),
        );
      });

      it('el resumen incluye las anotaciones del partido (lee con find, no con countBy)', async () => {
        partidoRepo.findOne.mockResolvedValue(conResultado(E.EN_JUEGO));
        anotacionRepo.find.mockResolvedValue([
          {
            id: 1,
            minuto: 0,
            valor: 2,
            jugador: { nombres: 'Juan', apellidos: 'Pérez' },
          },
          {
            id: 2,
            minuto: null,
            valor: 1,
            jugador: { nombres: 'Ana', apellidos: 'Ríos' },
          },
        ]);
        await service.cambiarEstado(20, E.FINALIZADO);
        await vaciarPromesas();

        const html = correo.enviar.mock.calls[0][2] as string;
        expect(html).toContain('minuto 0');
        expect(html).toContain('sin minuto');
      });

      it('si el correo falla, finalizar responde bien igual', async () => {
        partidoRepo.findOne.mockResolvedValue(conResultado(E.EN_JUEGO));
        destinatarios.aficionadosDelPartido.mockRejectedValue(new Error('x'));
        await expect(
          service.cambiarEstado(20, E.FINALIZADO),
        ).resolves.toMatchObject({ estado: 'FINALIZADO' });
        await vaciarPromesas();
      });
    });
  });

  // ==================================================================================
  describe('registrarResultado (HU-GC-07, ACUERDOS 6.12 y 9.11)', () => {
    const E = EstadoPartido;
    const resultado = (l = 2, v = 1) => ({
      marcadorLocal: l,
      marcadorVisitante: v,
    });

    it('lanza NOT_FOUND si el partido no existe y no guarda', async () => {
      partidoRepo.findOne.mockResolvedValue(null);
      await esperarErrorCase(
        service.registrarResultado(99, resultado()),
        ErrorCase.NOT_FOUND,
      );
      expect(partidoRepo.save).not.toHaveBeenCalled();
    });

    it.each([E.PROGRAMADO, E.CANCELADO])(
      'lanza INVALID_OPERATION si el partido está %s (solo EN_JUEGO o FINALIZADO)',
      async (estado) => {
        partidoRepo.findOne.mockResolvedValue(partidoBase({ estado }));
        await esperarErrorCase(
          service.registrarResultado(20, resultado()),
          ErrorCase.INVALID_OPERATION,
        );
        expect(partidoRepo.save).not.toHaveBeenCalled();
      },
    );

    it.each([E.EN_JUEGO, E.FINALIZADO])(
      'permite registrar el resultado si el partido está %s',
      async (estado) => {
        partidoRepo.findOne.mockResolvedValue(partidoBase({ estado }));
        await expect(
          service.registrarResultado(20, resultado()),
        ).resolves.toBeDefined();
        expect(partidoRepo.save).toHaveBeenCalledTimes(1);
      },
    );

    it('lanza INVALID_OPERATION si el torneo está FINALIZADO (aunque el partido esté EN_JUEGO)', async () => {
      partidoRepo.findOne.mockResolvedValue(
        partidoBase({
          estado: E.EN_JUEGO,
          fase: grupoBase({
            torneo: torneoBase({ estado: EstadoTorneo.FINALIZADO }),
          }),
        }),
      );
      await esperarErrorCase(
        service.registrarResultado(20, resultado()),
        ErrorCase.INVALID_OPERATION,
      );
      expect(partidoRepo.save).not.toHaveBeenCalled();
    });

    it('permite registrar si el torneo está EN_CURSO (no solo "no FINALIZADO" por casualidad)', async () => {
      partidoRepo.findOne.mockResolvedValue(
        partidoBase({
          estado: E.EN_JUEGO,
          fase: grupoBase({
            torneo: torneoBase({ estado: EstadoTorneo.EN_CURSO }),
          }),
        }),
      );
      await expect(
        service.registrarResultado(20, resultado()),
      ).resolves.toBeDefined();
    });

    it('un 0-0 es un resultado válido: se guarda y tieneResultado es true', async () => {
      partidoRepo.findOne.mockResolvedValue(
        partidoBase({ estado: E.EN_JUEGO }),
      );
      const r = await service.registrarResultado(20, resultado(0, 0));
      const guardado = partidoRepo.save.mock.calls[0][0];
      expect(guardado.marcadorLocal).toBe(0);
      expect(guardado.marcadorVisitante).toBe(0);
      expect(r.marcadorLocal).toBe(0);
      expect(r.marcadorVisitante).toBe(0);
      expect(r.tieneResultado).toBe(true);
    });

    it('guarda el marcador recibido y responde un PartidoResponse (no la entidad)', async () => {
      partidoRepo.findOne.mockResolvedValue(
        partidoBase({ estado: E.EN_JUEGO }),
      );
      anotacionRepo.countBy.mockResolvedValue(2);
      const r = await service.registrarResultado(20, resultado(3, 2));
      expect(r).not.toBeInstanceOf(Partido);
      expect(r).toMatchObject({
        id: 20,
        estado: 'EN_JUEGO',
        marcadorLocal: 3,
        marcadorVisitante: 2,
        tieneResultado: true,
        cantidadAnotaciones: 2,
      });
    });

    it('permite MODIFICAR el resultado de un partido FINALIZADO y no cambia el estado', async () => {
      partidoRepo.findOne.mockResolvedValue(
        partidoBase({
          estado: E.FINALIZADO,
          marcadorLocal: 1,
          marcadorVisitante: 1,
        }),
      );
      const r = await service.registrarResultado(20, resultado(4, 0));
      expect(r.estado).toBe('FINALIZADO');
      expect(r.marcadorLocal).toBe(4);
      expect(r.marcadorVisitante).toBe(0);
    });

    it('el marcador NO se calcula de las anotaciones (no consulta anotaciones para sumar)', async () => {
      partidoRepo.findOne.mockResolvedValue(
        partidoBase({ estado: E.EN_JUEGO }),
      );
      anotacionRepo.find.mockResolvedValue([{ valor: 1 }, { valor: 3 }]);
      const r = await service.registrarResultado(20, resultado(0, 0));
      expect(r.marcadorLocal).toBe(0);
      expect(r.marcadorVisitante).toBe(0);
    });

    it('registrar el resultado no envía correo (el resumen sale al FINALIZAR)', async () => {
      partidoRepo.findOne.mockResolvedValue(
        partidoBase({ estado: E.EN_JUEGO }),
      );
      await service.registrarResultado(20, resultado());
      await vaciarPromesas();
      expect(correo.enviar).not.toHaveBeenCalled();
    });
  });

  // ==================================================================================
  describe('eliminar', () => {
    it('lanza NOT_FOUND si el partido no existe', async () => {
      partidoRepo.findOne.mockResolvedValue(null);
      await esperarErrorCase(service.eliminar(99), ErrorCase.NOT_FOUND);
      expect(partidoRepo.remove).not.toHaveBeenCalled();
    });

    it.each([
      EstadoPartido.EN_JUEGO,
      EstadoPartido.FINALIZADO,
      EstadoPartido.CANCELADO,
    ])(
      'lanza INVALID_OPERATION si el partido está %s (solo se elimina PROGRAMADO)',
      async (estado) => {
        partidoRepo.findOne.mockResolvedValue(partidoBase({ estado }));
        await esperarErrorCase(
          service.eliminar(20),
          ErrorCase.INVALID_OPERATION,
        );
        expect(partidoRepo.remove).not.toHaveBeenCalled();
      },
    );

    it('lanza HAS_ASSOCIATIONS con el número de anotaciones y no llama remove', async () => {
      partidoRepo.findOne.mockResolvedValue(partidoBase());
      anotacionRepo.countBy.mockResolvedValue(3);

      const promesa = service.eliminar(20);

      await esperarErrorCase(promesa, ErrorCase.HAS_ASSOCIATIONS);
      await expect(promesa).rejects.toThrow(/3/);
      expect(anotacionRepo.countBy).toHaveBeenCalledWith({
        partido: { id: 20 },
      });
      expect(partidoRepo.remove).not.toHaveBeenCalled();
    });

    it('caso feliz: PROGRAMADO y sin anotaciones llama remove con el partido', async () => {
      const p = partidoBase();
      partidoRepo.findOne.mockResolvedValue(p);
      await expect(service.eliminar(20)).resolves.toBeUndefined();
      expect(partidoRepo.remove).toHaveBeenCalledWith(p);
    });
  });
});
