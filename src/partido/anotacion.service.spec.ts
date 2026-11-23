// Valores de EstadoTorneo según ACUERDOS 6.8.
// Clases REALES (no objetos sueltos) para que "fase instanceof Grupo / FaseFinal" funcione (ACUERDOS 6.11).

import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FindOperator } from 'typeorm';
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
import { CorreoService } from '../common/notificacion/correo.service';
import { DestinatariosService } from '../common/notificacion/destinatarios.service';
import { Equipo } from '../equipo/entities/equipo.entity';
import { EquipoJugador } from '../jugador/entities/equipo-jugador.entity';
import { Jugador } from '../jugador/entities/jugador.entity';
import { TipoDocumento } from '../jugador/entities/tipo-documento.enum';
import { AnotacionService } from './anotacion.service';
import { CrearAnotacionDto } from './dto/crear-anotacion.dto';
import { Anotacion } from './entities/anotacion.entity';
import { EstadoPartido } from './entities/estado-partido.enum';
import { Partido } from './entities/partido.entity';
import { EstadoTorneo } from '../torneo/entities/estado-torneo.enum';

// ------------------------------------------------------------------------------------
// Contrato: ACUERDOS 5.4, 6.12, 6.13, 8 y 9.11 + HISTORIAS_USUARIO HU-GC-07.
// Los repositorios simulados se comportan como una "BD" pequeña (filtran el where y respetan el
// order). Así las pruebas describen el ESTADO de la BD y no la forma exacta de la consulta.
// ------------------------------------------------------------------------------------
type Obj = Record<string, unknown>;

const idDe = (v: unknown): unknown => (v as Obj | null | undefined)?.id;

// Evalúa un "where" de TypeORM contra una fila: claves simples, relaciones { id } y FindOperator (In).
function cumpleWhere(fila: Obj, where: Obj): boolean {
  return Object.entries(where).every(([clave, esperado]) => {
    if (esperado instanceof FindOperator) {
      return (esperado.value as unknown[]).includes(fila[clave]);
    }
    if (typeof esperado === 'object' && esperado !== null) {
      const idEsperado = idDe(esperado);
      const idFila = idDe(fila[clave]);
      if (idEsperado instanceof FindOperator) {
        return (idEsperado.value as unknown[]).includes(idFila);
      }
      return idEsperado === idFila;
    }
    return fila[clave] === esperado;
  });
}

// "where" como objeto = AND; como arreglo = OR.
function filtrar(filas: Obj[], where?: Obj | Obj[]): Obj[] {
  if (!where) return [...filas];
  const ramas = Array.isArray(where) ? where : [where];
  return filas.filter((f) => ramas.some((r) => cumpleWhere(f, r)));
}

// order como en TypeORM; los NULL van primero en ASC (como MySQL).
function ordenar(filas: Obj[], order?: Record<string, string>): Obj[] {
  const copia = [...filas];
  if (!order) return copia;
  return copia.sort((a, b) => {
    for (const [clave, sentido] of Object.entries(order)) {
      const norm = (v: unknown) =>
        typeof v === 'boolean'
          ? Number(v)
          : ((v ?? null) as string | number | null);
      const x = norm(a[clave]);
      const y = norm(b[clave]);
      if (x === y) continue;
      let cmp: number;
      if (x === null) cmp = -1;
      else if (y === null) cmp = 1;
      else cmp = x < y ? -1 : 1;
      return String(sentido).toUpperCase() === 'DESC' ? -cmp : cmp;
    }
    return 0;
  });
}

interface OpcionesFind {
  where?: Obj | Obj[];
  order?: Record<string, string>;
}

const equipoBase = (id: number, nombre: string): Equipo =>
  ({ id, nombre, activo: true }) as unknown as Equipo;

const LOCAL = () => equipoBase(4, 'Once Caldas');
const VISITANTE = () => equipoBase(9, 'Deportes Pereira');
const TERCERO = () => equipoBase(15, 'Atlético Nacional');

const jugadorBase = (id = 7, extra: Obj = {}): Jugador =>
  ({
    id,
    tipoDocumento: TipoDocumento.CC,
    numeroDocumento: id === 7 ? '1053000000' : `10530000${id}`,
    nombres: id === 7 ? 'Juan' : `Jugador${id}`,
    apellidos: id === 7 ? 'Pérez' : 'Gómez',
    fechaNacimiento: '2000-01-01',
    email: null,
    telefono: null,
    activo: true,
    fechaCreacion: new Date(2026, 10, 1, 10, 0, 0),
    ...extra,
  }) as unknown as Jugador;

const contratoBase = (
  id: number,
  jugador: Jugador,
  equipo: Equipo,
  extra: Obj = {},
): EquipoJugador =>
  ({
    id,
    jugador,
    equipo,
    fechaInicio: '2026-01-01',
    fechaFin: '2027-01-01',
    fechaRetiro: null,
    activo: true,
    ...extra,
  }) as unknown as EquipoJugador;

async function esperarErrorCase(
  promesa: Promise<unknown>,
  errorCase: string,
): Promise<void> {
  await expect(promesa).rejects.toBeInstanceOf(ApplicationException);
  await expect(promesa).rejects.toMatchObject({ errorCase });
}

// Deja correr las promesas pendientes (el correo se envía SIN await, en segundo plano).
const vaciarPromesas = () => new Promise<void>((r) => setImmediate(r));

describe('AnotacionService (HU-GC-07)', () => {
  let service: AnotacionService;

  // "BD" que cada prueba puede modificar.
  let partido: Partido;
  let partidosBD: Record<number, Partido | null>;
  let jugadoresBD: Record<number, Jugador | null>;
  let contratosBD: EquipoJugador[];
  let anotacionesBD: Anotacion[];

  const anotacionRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };
  const partidoRepo = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const jugadorRepo = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const contratoRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    findBy: jest.fn(),
    findOneBy: jest.fn(),
    existsBy: jest.fn(),
    save: jest.fn(),
  };
  const correo = { enviar: jest.fn() };
  const destinatarios = {
    aficionadosDeEquipos: jest.fn(),
    aficionadosDelPartido: jest.fn(),
  };

  const consultasDeContratos = () =>
    contratoRepo.find.mock.calls.length +
    contratoRepo.findOne.mock.calls.length +
    contratoRepo.findBy.mock.calls.length +
    contratoRepo.findOneBy.mock.calls.length +
    contratoRepo.existsBy.mock.calls.length;

  // El partido llega con fase.torneo (las reglas del torneo) y fechaHora (el equipo del día del partido).
  // Día del partido: 2026-12-05.
  const partidoBase = (extra: Obj = {}): Partido =>
    ({
      id: 20,
      fase: {
        id: 3,
        nombre: 'Grupo A',
        torneo: {
          id: 1,
          nombre: 'Copa Caldas 2026',
          estado: EstadoTorneo.EN_CURSO,
        },
      },
      fechaHora: new Date(2026, 11, 5, 15, 30, 0),
      equipoLocal: LOCAL(),
      equipoVisitante: VISITANTE(),
      estado: EstadoPartido.EN_JUEGO,
      marcadorLocal: 1,
      marcadorVisitante: 0,
      ...extra,
    }) as unknown as Partido;

  const dtoBase = (
    extra: Partial<CrearAnotacionDto> = {},
  ): CrearAnotacionDto => ({
    jugadorId: 7,
    minuto: 34,
    valor: 1,
    descripcion: 'Gol de cabeza',
    ...extra,
  });

  // Anotación ya guardada (para listar, actualizar y eliminar).
  const anotacionBase = (extra: Obj = {}): Anotacion =>
    ({
      id: 50,
      partido,
      jugador: jugadoresBD[7],
      minuto: 34,
      valor: 1,
      descripcion: 'Gol de cabeza',
      fechaRegistro: new Date(2026, 11, 5, 16, 5, 0),
      ...extra,
    }) as unknown as Anotacion;

  const contratoActivoConLocal = (jugadorId = 7) =>
    contratoBase(1, jugadoresBD[jugadorId] as Jugador, LOCAL());

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    partido = partidoBase();
    partidosBD = { 20: partido };
    jugadoresBD = { 7: jugadorBase(7) };
    contratosBD = [];
    anotacionesBD = [];

    partidoRepo.findOne.mockImplementation(({ where }: { where: Obj }) =>
      Promise.resolve(partidosBD[where.id as number] ?? null),
    );
    partidoRepo.findOneBy.mockImplementation(({ id }: { id: number }) =>
      Promise.resolve(partidosBD[id] ?? null),
    );
    jugadorRepo.findOne.mockImplementation(({ where }: { where: Obj }) =>
      Promise.resolve(jugadoresBD[where.id as number] ?? null),
    );
    jugadorRepo.findOneBy.mockImplementation(({ id }: { id: number }) =>
      Promise.resolve(jugadoresBD[id] ?? null),
    );

    const buscarContratos = (o: OpcionesFind) =>
      ordenar(filtrar(contratosBD as unknown as Obj[], o.where), o.order);
    contratoRepo.find.mockImplementation((o: OpcionesFind) =>
      Promise.resolve(buscarContratos(o)),
    );
    contratoRepo.findOne.mockImplementation((o: OpcionesFind) =>
      Promise.resolve(buscarContratos(o)[0] ?? null),
    );
    contratoRepo.findBy.mockImplementation((where: Obj | Obj[]) =>
      Promise.resolve(buscarContratos({ where })),
    );
    contratoRepo.findOneBy.mockImplementation((where: Obj | Obj[]) =>
      Promise.resolve(buscarContratos({ where })[0] ?? null),
    );
    contratoRepo.existsBy.mockImplementation((where: Obj | Obj[]) =>
      Promise.resolve(buscarContratos({ where }).length > 0),
    );

    // Como TypeORM: create no toca la BD y save completa id y fecha SOBRE el mismo objeto.
    anotacionRepo.create.mockImplementation((d: Obj) => ({ ...d }));
    anotacionRepo.save.mockImplementation((a: Obj) => {
      a.id = a.id ?? 50;
      a.fechaRegistro = a.fechaRegistro ?? new Date(2026, 11, 5, 16, 5, 0);
      return Promise.resolve(a);
    });
    anotacionRepo.find.mockImplementation((o: OpcionesFind) =>
      Promise.resolve(
        ordenar(filtrar(anotacionesBD as unknown as Obj[], o.where), o.order),
      ),
    );
    anotacionRepo.findOne.mockImplementation((o: OpcionesFind) =>
      Promise.resolve(
        filtrar(anotacionesBD as unknown as Obj[], o.where)[0] ?? null,
      ),
    );
    anotacionRepo.remove.mockResolvedValue(undefined);

    correo.enviar.mockReturnValue(undefined);
    destinatarios.aficionadosDelPartido.mockResolvedValue(['a@gmail.com']);
    destinatarios.aficionadosDeEquipos.mockResolvedValue(['a@gmail.com']);

    const modulo = await Test.createTestingModule({
      providers: [
        AnotacionService,
        { provide: getRepositoryToken(Anotacion), useValue: anotacionRepo },
        { provide: getRepositoryToken(Partido), useValue: partidoRepo },
        { provide: getRepositoryToken(Jugador), useValue: jugadorRepo },
        { provide: getRepositoryToken(EquipoJugador), useValue: contratoRepo },
        { provide: CorreoService, useValue: correo },
        { provide: DestinatariosService, useValue: destinatarios },
      ],
    }).compile();
    service = modulo.get(AnotacionService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==================================================================================
  // Reglas comunes de crear y actualizar (6.13): se prueban en los dos métodos con la misma tabla.
  // ==================================================================================
  type Accion = () => Promise<unknown>;

  // J = el jugador que trae el body. En crear es el 7. En actualizar es OTRO (el 8) porque la anotación
  // original es del 7: las reglas del jugador solo aplican en actualizar cuando CAMBIA el jugador.
  function reglasDeAnotacion(
    nombre: string,
    J: number,
    ejecutar: (dto: CrearAnotacionDto) => Accion,
    preparar: () => void,
    noGuarda: () => void,
  ) {
    describe(`reglas de ${nombre} (6.13)`, () => {
      beforeEach(() => {
        jugadoresBD[J] = jugadorBase(J);
        preparar();
        contratosBD = [contratoActivoConLocal(J)];
      });

      const rechaza = async (promesa: Promise<unknown>, errorCase: string) => {
        await esperarErrorCase(promesa, errorCase);
        noGuarda();
      };

      it('lanza NOT_FOUND si el jugador no existe', async () => {
        jugadoresBD[99] = null;
        await rechaza(
          ejecutar(dtoBase({ jugadorId: 99 }))(),
          ErrorCase.NOT_FOUND,
        );
      });

      it('el 404 del jugador gana aunque el partido esté CANCELADO (400)', async () => {
        partido.estado = EstadoPartido.CANCELADO;
        jugadoresBD[99] = null;
        await rechaza(
          ejecutar(dtoBase({ jugadorId: 99 }))(),
          ErrorCase.NOT_FOUND,
        );
      });

      it.each([EstadoPartido.PROGRAMADO, EstadoPartido.CANCELADO])(
        'lanza INVALID_OPERATION si el partido está %s (solo EN_JUEGO o FINALIZADO)',
        async (estado) => {
          partido.estado = estado;
          await rechaza(
            ejecutar(dtoBase({ jugadorId: J }))(),
            ErrorCase.INVALID_OPERATION,
          );
        },
      );

      it('el mensaje del partido en mal estado dice qué se puede hacer y el estado actual', async () => {
        partido.estado = EstadoPartido.PROGRAMADO;
        await expect(ejecutar(dtoBase({ jugadorId: J }))()).rejects.toThrow(
          /EN_JUEGO o FINALIZADO/,
        );
        await expect(ejecutar(dtoBase({ jugadorId: J }))()).rejects.toThrow(
          /PROGRAMADO/,
        );
      });

      it.each([EstadoPartido.EN_JUEGO, EstadoPartido.FINALIZADO])(
        'permite si el partido está %s',
        async (estado) => {
          partido.estado = estado;
          await expect(
            ejecutar(dtoBase({ jugadorId: J }))(),
          ).resolves.toBeDefined();
        },
      );

      // Estado del torneo (6.12 y 6.13): FINALIZADO bloquea; CANCELADO (u otro) no.
      it('lanza INVALID_OPERATION si el torneo está FINALIZADO', async () => {
        partido.fase.torneo.estado = EstadoTorneo.FINALIZADO;
        await rechaza(
          ejecutar(dtoBase({ jugadorId: J }))(),
          ErrorCase.INVALID_OPERATION,
        );
      });

      it('el mensaje del torneo FINALIZADO nombra el torneo', async () => {
        partido.fase.torneo.estado = EstadoTorneo.FINALIZADO;
        await expect(ejecutar(dtoBase({ jugadorId: J }))()).rejects.toThrow(
          /Copa Caldas 2026/,
        );
      });

      it.each([
        EstadoTorneo.CANCELADO,
        EstadoTorneo.EN_CURSO,
        EstadoTorneo.INSCRIPCIONES_CERRADAS,
      ])(
        'permite si el torneo está %s (solo FINALIZADO bloquea)',
        async (e) => {
          partido.fase.torneo.estado = e;
          await expect(
            ejecutar(dtoBase({ jugadorId: J }))(),
          ).resolves.toBeDefined();
        },
      );

      it('lanza INVALID_OPERATION si el jugador está inactivo (aunque tenga contrato activo)', async () => {
        jugadoresBD[J] = jugadorBase(J, { activo: false });
        contratosBD = [contratoActivoConLocal(J)];
        await rechaza(
          ejecutar(dtoBase({ jugadorId: J }))(),
          ErrorCase.INVALID_OPERATION,
        );
      });

      it('lanza INVALID_OPERATION si el jugador no tiene ningún contrato', async () => {
        contratosBD = [];
        await rechaza(
          ejecutar(dtoBase({ jugadorId: J }))(),
          ErrorCase.INVALID_OPERATION,
        );
      });

      it('lanza INVALID_OPERATION si su único contrato activo es con un TERCER equipo', async () => {
        contratosBD = [contratoBase(2, jugadoresBD[J] as Jugador, TERCERO())];
        await rechaza(
          ejecutar(dtoBase({ jugadorId: J }))(),
          ErrorCase.INVALID_OPERATION,
        );
      });

      it('lanza INVALID_OPERATION si su contrato con el LOCAL está retirado (activo = false)', async () => {
        contratosBD = [
          contratoBase(3, jugadoresBD[J] as Jugador, LOCAL(), {
            activo: false,
            fechaRetiro: '2026-06-01',
          }),
        ];
        await rechaza(
          ejecutar(dtoBase({ jugadorId: J }))(),
          ErrorCase.INVALID_OPERATION,
        );
      });

      it('lanza INVALID_OPERATION si su contrato con el VISITANTE está retirado', async () => {
        contratosBD = [
          contratoBase(3, jugadoresBD[J] as Jugador, VISITANTE(), {
            activo: false,
            fechaRetiro: '2026-06-01',
          }),
        ];
        await rechaza(
          ejecutar(dtoBase({ jugadorId: J }))(),
          ErrorCase.INVALID_OPERATION,
        );
      });

      it('el contrato activo de OTRO jugador con el local no cuenta', async () => {
        jugadoresBD[30] = jugadorBase(30);
        contratosBD = [contratoBase(4, jugadoresBD[30], LOCAL())];
        await rechaza(
          ejecutar(dtoBase({ jugadorId: J }))(),
          ErrorCase.INVALID_OPERATION,
        );
      });

      it('con contrato activo con el LOCAL, la respuesta trae el equipo local', async () => {
        contratosBD = [contratoBase(1, jugadoresBD[J] as Jugador, LOCAL())];
        const r = (await ejecutar(dtoBase({ jugadorId: J }))()) as {
          equipo: Obj;
        };
        expect(r.equipo).toEqual({
          id: 4,
          nombre: 'Once Caldas',
          activo: true,
        });
      });

      it('con contrato activo con el VISITANTE, la respuesta trae el equipo visitante', async () => {
        contratosBD = [contratoBase(1, jugadoresBD[J] as Jugador, VISITANTE())];
        const r = (await ejecutar(dtoBase({ jugadorId: J }))()) as {
          equipo: Obj;
        };
        expect(r.equipo).toEqual({
          id: 9,
          nombre: 'Deportes Pereira',
          activo: true,
        });
      });

      it('retirado del local pero activo con el visitante: el equipo es el visitante', async () => {
        contratosBD = [
          contratoBase(1, jugadoresBD[J] as Jugador, LOCAL(), {
            activo: false,
            fechaRetiro: '2026-06-01',
          }),
          contratoBase(2, jugadoresBD[J] as Jugador, VISITANTE()),
        ];
        const r = (await ejecutar(dtoBase({ jugadorId: J }))()) as {
          equipo: Obj;
        };
        expect(r.equipo).toMatchObject({ id: 9 });
      });

      it('valor ausente → 1 en lo guardado y en la respuesta', async () => {
        const r = (await ejecutar({ jugadorId: J, minuto: 34 })()) as {
          valor: number;
        };
        expect(r.valor).toBe(1);
        const guardado = anotacionRepo.save.mock.calls[0][0] as Obj;
        expect(guardado.valor).toBe(1);
      });

      it('minuto y descripcion ausentes → null (PUT reemplaza todo)', async () => {
        const r = (await ejecutar({ jugadorId: J })()) as Obj;
        expect(r.minuto).toBeNull();
        expect(r.descripcion).toBeNull();
      });

      it('un minuto 0 se conserva en 0', async () => {
        const r = (await ejecutar(
          dtoBase({ jugadorId: J, minuto: 0 }),
        )()) as Obj;
        expect(r.minuto).toBe(0);
      });
    });
  }

  // ==================================================================================
  describe('crear', () => {
    const noGuarda = () => {
      expect(anotacionRepo.save).not.toHaveBeenCalled();
      expect(destinatarios.aficionadosDelPartido).not.toHaveBeenCalled();
      expect(correo.enviar).not.toHaveBeenCalled();
    };

    describe('existencia (404 antes que cualquier 400)', () => {
      it('lanza NOT_FOUND si el partido no existe', async () => {
        partidosBD[99] = null;
        await esperarErrorCase(
          service.crear(99, dtoBase()),
          ErrorCase.NOT_FOUND,
        );
        noGuarda();
      });

      it('lanza NOT_FOUND si el jugador no existe', async () => {
        jugadoresBD[99] = null;
        await esperarErrorCase(
          service.crear(20, dtoBase({ jugadorId: 99 })),
          ErrorCase.NOT_FOUND,
        );
        noGuarda();
      });

      it('el 404 del jugador gana aunque el partido esté PROGRAMADO (400)', async () => {
        partido.estado = EstadoPartido.PROGRAMADO;
        await esperarErrorCase(
          service.crear(20, dtoBase({ jugadorId: 99 })),
          ErrorCase.NOT_FOUND,
        );
      });

      it('el 404 del partido gana aunque el jugador esté inactivo (400)', async () => {
        jugadoresBD[7] = jugadorBase(7, { activo: false });
        await esperarErrorCase(
          service.crear(99, dtoBase()),
          ErrorCase.NOT_FOUND,
        );
      });

      it('si el partido no existe no se consulta ningún contrato', async () => {
        await service.crear(99, dtoBase()).catch(() => undefined);
        expect(consultasDeContratos()).toBe(0);
      });
    });

    reglasDeAnotacion(
      'crear',
      7,
      (dto) => () => service.crear(20, dto),
      () => undefined,
      noGuarda,
    );

    describe('caso feliz', () => {
      beforeEach(() => {
        contratosBD = [contratoActivoConLocal()];
      });

      it('guarda con el partido y el jugador, y devuelve el AnotacionResponse de 9.11', async () => {
        const r = await service.crear(20, dtoBase());

        expect(anotacionRepo.save).toHaveBeenCalledTimes(1);
        const guardado = anotacionRepo.save.mock.calls[0][0] as Obj;
        expect(idDe(guardado.partido)).toBe(20);
        expect(idDe(guardado.jugador)).toBe(7);
        expect(guardado.minuto).toBe(34);
        expect(guardado.valor).toBe(1);
        expect(guardado.descripcion).toBe('Gol de cabeza');

        expect(r).toEqual({
          id: 50,
          partidoId: 20,
          jugador: {
            id: 7,
            tipoDocumento: 'CC',
            numeroDocumento: '1053000000',
            nombreCompleto: 'Juan Pérez',
            activo: true,
          },
          equipo: { id: 4, nombre: 'Once Caldas', activo: true },
          minuto: 34,
          valor: 1,
          descripcion: 'Gol de cabeza',
          fechaRegistro: '2026-12-05T16:05:00',
        });
      });

      it('guarda un valor distinto de 1 cuando viene (un triple = 3)', async () => {
        const r = await service.crear(20, dtoBase({ valor: 3 }));
        expect(r.valor).toBe(3);
        expect((anotacionRepo.save.mock.calls[0][0] as Obj).valor).toBe(3);
      });

      it('no devuelve una instancia de la entidad Anotacion', async () => {
        const r = await service.crear(20, dtoBase());
        expect(r).not.toBeInstanceOf(Anotacion);
      });

      it('no modifica el partido ni el jugador (solo escribe la anotación)', async () => {
        await service.crear(20, dtoBase());
        expect(partidoRepo.save).not.toHaveBeenCalled();
        expect(jugadorRepo.save).not.toHaveBeenCalled();
        expect(contratoRepo.save).not.toHaveBeenCalled();
      });
    });

    describe('correo "¡Anotación!" (ACUERDOS 8)', () => {
      beforeEach(() => {
        contratosBD = [contratoActivoConLocal()];
      });

      it('se llama DESPUÉS de guardar (save antes que destinatarios y envío)', async () => {
        await service.crear(20, dtoBase());
        await vaciarPromesas();

        expect(destinatarios.aficionadosDelPartido).toHaveBeenCalledWith(20);
        expect(correo.enviar).toHaveBeenCalledTimes(1);

        const ordenSave = anotacionRepo.save.mock.invocationCallOrder[0];
        const ordenDestinatarios =
          destinatarios.aficionadosDelPartido.mock.invocationCallOrder[0];
        const ordenEnvio = correo.enviar.mock.invocationCallOrder[0];
        expect(ordenSave).toBeLessThan(ordenDestinatarios);
        expect(ordenSave).toBeLessThan(ordenEnvio);
      });

      it('envía a los destinatarios con el asunto "¡Anotación en {local} vs {visitante}!"', async () => {
        await service.crear(20, dtoBase());
        await vaciarPromesas();

        const [para, asunto, html] = correo.enviar.mock.calls[0] as [
          string[],
          string,
          string,
        ];
        expect(para).toEqual(['a@gmail.com']);
        expect(asunto).toBe('¡Anotación en Once Caldas vs Deportes Pereira!');
        expect(html).toContain('Juan Pérez');
        expect(html).toContain('34');
      });

      it('NO espera al correo: si los destinatarios nunca responden, crear igual responde', async () => {
        destinatarios.aficionadosDelPartido.mockReturnValue(
          new Promise(() => undefined),
        );
        await expect(service.crear(20, dtoBase())).resolves.toMatchObject({
          id: 50,
        });
        expect(anotacionRepo.save).toHaveBeenCalledTimes(1);
      });

      it('si aficionadosDelPartido rechaza, la respuesta igual sale (y no se envía)', async () => {
        destinatarios.aficionadosDelPartido.mockRejectedValue(
          new Error('falló la consulta'),
        );
        await expect(service.crear(20, dtoBase())).resolves.toMatchObject({
          id: 50,
        });
        await vaciarPromesas();
        expect(correo.enviar).not.toHaveBeenCalled();
        expect(anotacionRepo.save).toHaveBeenCalledTimes(1);
      });

      it('si enviar lanza error, la respuesta igual sale', async () => {
        correo.enviar.mockImplementation(() => {
          throw new Error('ms-notifications caído');
        });
        await expect(service.crear(20, dtoBase())).resolves.toMatchObject({
          id: 50,
        });
        await vaciarPromesas();
        expect(anotacionRepo.save).toHaveBeenCalledTimes(1);
      });

      it('no envía correo si una regla falla', async () => {
        partido.estado = EstadoPartido.PROGRAMADO;
        await service.crear(20, dtoBase()).catch(() => undefined);
        await vaciarPromesas();
        expect(correo.enviar).not.toHaveBeenCalled();
        expect(destinatarios.aficionadosDelPartido).not.toHaveBeenCalled();
      });
    });
  });

  // ==================================================================================
  describe('listar', () => {
    it('lanza NOT_FOUND si el partido no existe (no responde [])', async () => {
      partidosBD[99] = null;
      await esperarErrorCase(service.listar(99), ErrorCase.NOT_FOUND);
      expect(anotacionRepo.find).not.toHaveBeenCalled();
    });

    it('un partido sin anotaciones devuelve [] con a lo sumo una consulta de contratos', async () => {
      await expect(service.listar(20)).resolves.toEqual([]);
      expect(consultasDeContratos()).toBeLessThanOrEqual(1);
    });

    it('ordena por minuto ASC (9.11: "por minuto")', async () => {
      contratosBD = [contratoActivoConLocal()];
      anotacionesBD = [
        anotacionBase({ id: 3, minuto: 40 }),
        anotacionBase({ id: 1, minuto: 10 }),
        anotacionBase({ id: 2, minuto: 25 }),
      ];
      const r = await service.listar(20);
      expect(r.map((a) => a.minuto)).toEqual([10, 25, 40]);
      expect(r.map((a) => a.id)).toEqual([1, 2, 3]);
    });

    it('solo trae las anotaciones de ESE partido', async () => {
      contratosBD = [contratoActivoConLocal()];
      const otroPartido = partidoBase({ id: 21 });
      anotacionesBD = [
        anotacionBase({ id: 1, minuto: 10 }),
        anotacionBase({ id: 2, minuto: 20, partido: otroPartido }),
      ];
      const r = await service.listar(20);
      expect(r.map((a) => a.id)).toEqual([1]);
      expect(r[0].partidoId).toBe(20);
    });

    it('cada elemento es un AnotacionResponse (jugador resumen, equipo y fecha en texto)', async () => {
      contratosBD = [contratoActivoConLocal()];
      anotacionesBD = [anotacionBase()];
      const [a] = await service.listar(20);
      expect(a).not.toBeInstanceOf(Anotacion);
      expect(a).toEqual({
        id: 50,
        partidoId: 20,
        jugador: {
          id: 7,
          tipoDocumento: 'CC',
          numeroDocumento: '1053000000',
          nombreCompleto: 'Juan Pérez',
          activo: true,
        },
        equipo: { id: 4, nombre: 'Once Caldas', activo: true },
        minuto: 34,
        valor: 1,
        descripcion: 'Gol de cabeza',
        fechaRegistro: '2026-12-05T16:05:00',
      });
    });

    it('el equipo se deduce también con un contrato ya RETIRADO (la anotación no pierde su equipo)', async () => {
      contratosBD = [
        contratoBase(1, jugadoresBD[7] as Jugador, LOCAL(), {
          activo: false,
          fechaRetiro: '2026-12-10',
        }),
      ];
      anotacionesBD = [anotacionBase()];
      const [a] = await service.listar(20);
      expect(a.equipo).toEqual({ id: 4, nombre: 'Once Caldas', activo: true });
    });

    it('con varios jugadores, cada anotación trae SU equipo y se hace UNA sola consulta de contratos (sin N+1)', async () => {
      jugadoresBD[8] = jugadorBase(8);
      jugadoresBD[9] = jugadorBase(9);
      contratosBD = [
        contratoBase(1, jugadoresBD[7] as Jugador, LOCAL()),
        contratoBase(2, jugadoresBD[8], VISITANTE()),
        contratoBase(3, jugadoresBD[9], LOCAL(), {
          activo: false,
          fechaRetiro: '2026-12-10',
        }),
      ];
      anotacionesBD = [
        anotacionBase({ id: 1, minuto: 10, jugador: jugadoresBD[7] }),
        anotacionBase({ id: 2, minuto: 20, jugador: jugadoresBD[8] }),
        anotacionBase({ id: 3, minuto: 30, jugador: jugadoresBD[9] }),
      ];

      const r = await service.listar(20);

      expect(r.map((a) => (a.equipo as { id: number }).id)).toEqual([4, 9, 4]);
      expect(consultasDeContratos()).toBe(1);
    });

    it('con 5 anotaciones del mismo jugador sigue siendo UNA consulta de contratos', async () => {
      contratosBD = [contratoActivoConLocal()];
      anotacionesBD = [1, 2, 3, 4, 5].map((n) =>
        anotacionBase({ id: n, minuto: n * 10 }),
      );
      await service.listar(20);
      expect(consultasDeContratos()).toBe(1);
    });

    // El equipo es el del contrato que cubría la FECHA DEL PARTIDO (2026-12-05):
    // fechaInicio <= fecha y (fechaRetiro null o >= fecha).
    describe('equipo del día del partido', () => {
      const listarEquipo = async () => {
        anotacionesBD = [anotacionBase()];
        const [a] = await service.listar(20);
        return a.equipo;
      };

      it('un jugador que se pasó al rival DESPUÉS del partido sale con el equipo de ese día', async () => {
        contratosBD = [
          contratoBase(1, jugadoresBD[7] as Jugador, LOCAL(), {
            fechaInicio: '2026-01-01',
            activo: false,
            fechaRetiro: '2026-12-10',
          }),
          contratoBase(2, jugadoresBD[7] as Jugador, VISITANTE(), {
            fechaInicio: '2026-12-11',
          }),
        ];
        expect(await listarEquipo()).toMatchObject({ id: 4 });
      });

      it('lo mismo al revés: venía del visitante y se pasó al local después', async () => {
        contratosBD = [
          contratoBase(1, jugadoresBD[7] as Jugador, VISITANTE(), {
            activo: false,
            fechaRetiro: '2026-12-10',
          }),
          contratoBase(2, jugadoresBD[7] as Jugador, LOCAL(), {
            fechaInicio: '2026-12-11',
          }),
        ];
        expect(await listarEquipo()).toMatchObject({ id: 9 });
      });

      it('borde: retirado EL MISMO DÍA del partido todavía cubre la fecha (fechaRetiro >= fecha)', async () => {
        contratosBD = [
          contratoBase(1, jugadoresBD[7] as Jugador, LOCAL(), {
            activo: false,
            fechaRetiro: '2026-12-05',
          }),
          contratoBase(2, jugadoresBD[7] as Jugador, VISITANTE(), {
            fechaInicio: '2026-12-06',
          }),
        ];
        expect(await listarEquipo()).toMatchObject({ id: 4 });
      });

      it('borde: retirado el día ANTES del partido ya no cubre la fecha', async () => {
        contratosBD = [
          contratoBase(1, jugadoresBD[7] as Jugador, LOCAL(), {
            activo: false,
            fechaRetiro: '2026-12-04',
          }),
          contratoBase(2, jugadoresBD[7] as Jugador, VISITANTE(), {
            fechaInicio: '2026-12-04',
          }),
        ];
        expect(await listarEquipo()).toMatchObject({ id: 9 });
      });

      it('borde: un contrato que empieza EL MISMO DÍA del partido cubre la fecha (fechaInicio <= fecha)', async () => {
        contratosBD = [
          contratoBase(1, jugadoresBD[7] as Jugador, LOCAL(), {
            activo: false,
            fechaInicio: '2026-01-01',
            fechaRetiro: '2026-12-04',
          }),
          contratoBase(2, jugadoresBD[7] as Jugador, VISITANTE(), {
            fechaInicio: '2026-12-05',
          }),
        ];
        expect(await listarEquipo()).toMatchObject({ id: 9 });
      });

      it('un contrato que empieza DESPUÉS del partido no cubre la fecha (pero sirve de respaldo si no hay otro)', async () => {
        contratosBD = [
          contratoBase(1, jugadoresBD[7] as Jugador, LOCAL(), {
            fechaInicio: '2026-12-20',
          }),
        ];
        expect(await listarEquipo()).toMatchObject({ id: 4 });
      });

      it('con varios jugadores cada uno trae el equipo de SU contrato del día y sigue siendo UNA consulta', async () => {
        jugadoresBD[8] = jugadorBase(8);
        contratosBD = [
          contratoBase(1, jugadoresBD[7] as Jugador, LOCAL(), {
            activo: false,
            fechaRetiro: '2026-12-10',
          }),
          contratoBase(2, jugadoresBD[7] as Jugador, VISITANTE(), {
            fechaInicio: '2026-12-11',
          }),
          contratoBase(3, jugadoresBD[8], VISITANTE()),
        ];
        anotacionesBD = [
          anotacionBase({ id: 1, minuto: 10, jugador: jugadoresBD[7] }),
          anotacionBase({ id: 2, minuto: 20, jugador: jugadoresBD[8] }),
        ];
        const r = await service.listar(20);
        expect(r.map((a) => (a.equipo as { id: number }).id)).toEqual([4, 9]);
        expect(consultasDeContratos()).toBe(1);
      });
    });

    it('los contratos de un jugador con un TERCER equipo no se usan como equipo de la anotación', async () => {
      contratosBD = [
        contratoBase(1, jugadoresBD[7] as Jugador, TERCERO()),
        contratoBase(2, jugadoresBD[7] as Jugador, VISITANTE()),
      ];
      anotacionesBD = [anotacionBase()];
      const [a] = await service.listar(20);
      expect(a.equipo).toMatchObject({ id: 9 });
    });
  });

  // ==================================================================================
  describe('actualizar', () => {
    const noGuarda = () => {
      expect(anotacionRepo.save).not.toHaveBeenCalled();
    };

    describe('existencia (404)', () => {
      it('lanza NOT_FOUND si la anotación no existe', async () => {
        await esperarErrorCase(
          service.actualizar(99, dtoBase()),
          ErrorCase.NOT_FOUND,
        );
        noGuarda();
      });

      it('el 404 de la anotación gana aunque el jugador del body no exista', async () => {
        await esperarErrorCase(
          service.actualizar(99, dtoBase({ jugadorId: 88 })),
          ErrorCase.NOT_FOUND,
        );
      });
    });

    reglasDeAnotacion(
      'actualizar',
      8, // la anotación es del jugador 7: el body trae OTRO jugador
      (dto) => () => service.actualizar(50, dto),
      () => {
        anotacionesBD = [anotacionBase()];
      },
      noGuarda,
    );

    describe('caso feliz', () => {
      beforeEach(() => {
        jugadoresBD[8] = jugadorBase(8);
        contratosBD = [
          contratoBase(1, jugadoresBD[7] as Jugador, LOCAL()),
          contratoBase(2, jugadoresBD[8], VISITANTE()),
        ];
        anotacionesBD = [anotacionBase()];
      });

      it('reemplaza los datos (cambia jugador, minuto, valor y descripción) y guarda con save', async () => {
        const r = await service.actualizar(
          50,
          dtoBase({
            jugadorId: 8,
            minuto: 70,
            valor: 3,
            descripcion: 'Triple',
          }),
        );

        expect(anotacionRepo.save).toHaveBeenCalledTimes(1);
        const guardado = anotacionRepo.save.mock.calls[0][0] as Obj;
        expect(guardado.id).toBe(50);
        expect(idDe(guardado.jugador)).toBe(8);

        expect(r).toMatchObject({
          id: 50,
          partidoId: 20,
          minuto: 70,
          valor: 3,
          descripcion: 'Triple',
        });
        expect(r.jugador.id).toBe(8);
        expect(r.equipo).toMatchObject({ id: 9 });
      });

      it('no cambia de partido ni crea una anotación nueva', async () => {
        const r = await service.actualizar(50, dtoBase({ jugadorId: 8 }));
        expect(anotacionRepo.create).not.toHaveBeenCalled();
        expect(partidoRepo.save).not.toHaveBeenCalled();
        expect(r.partidoId).toBe(20);
      });

      it('no envía correo (el correo es solo al REGISTRAR una anotación)', async () => {
        await service.actualizar(50, dtoBase());
        await vaciarPromesas();
        expect(destinatarios.aficionadosDelPartido).not.toHaveBeenCalled();
        expect(correo.enviar).not.toHaveBeenCalled();
      });

      it('no devuelve una instancia de la entidad Anotacion', async () => {
        const r = await service.actualizar(50, dtoBase());
        expect(r).not.toBeInstanceOf(Anotacion);
      });
    });

    // Las reglas del jugador (activo y contrato activo) aplican SOLO si CAMBIA el jugador. Con el mismo
    // jugador se puede corregir el minuto aunque después se haya inactivado o retirado.
    describe('mismo jugador (las reglas del jugador no aplican)', () => {
      beforeEach(() => {
        anotacionesBD = [anotacionBase()]; // jugador 7
      });

      it('permite editar si el jugador está INACTIVO', async () => {
        jugadoresBD[7] = jugadorBase(7, { activo: false });
        anotacionesBD = [anotacionBase({ jugador: jugadoresBD[7] })];
        contratosBD = [contratoActivoConLocal()];

        const r = await service.actualizar(50, dtoBase({ minuto: 41 }));

        expect(r.minuto).toBe(41);
        expect(r.jugador.id).toBe(7);
        expect(anotacionRepo.save).toHaveBeenCalledTimes(1);
      });

      it('permite editar si su contrato fue RETIRADO (después del partido)', async () => {
        contratosBD = [
          contratoBase(1, jugadoresBD[7] as Jugador, LOCAL(), {
            activo: false,
            fechaRetiro: '2026-12-10',
          }),
        ];

        const r = await service.actualizar(50, dtoBase({ minuto: 41 }));

        expect(r.minuto).toBe(41);
        expect(r.equipo).toMatchObject({ id: 4 });
        expect(anotacionRepo.save).toHaveBeenCalledTimes(1);
      });

      it('permite editar si el jugador ya no tiene ningún contrato (el equipo sale null)', async () => {
        contratosBD = [];
        const r = await service.actualizar(50, dtoBase({ minuto: 41 }));
        expect(r.minuto).toBe(41);
        expect(r.equipo).toBeNull();
      });

      it('el equipo de la respuesta es el del día del partido aunque el jugador se pasó al rival después', async () => {
        contratosBD = [
          contratoBase(1, jugadoresBD[7] as Jugador, LOCAL(), {
            activo: false,
            fechaRetiro: '2026-12-10',
          }),
          contratoBase(2, jugadoresBD[7] as Jugador, VISITANTE(), {
            fechaInicio: '2026-12-11',
          }),
        ];
        const r = await service.actualizar(50, dtoBase());
        expect(r.equipo).toMatchObject({ id: 4 });
      });

      it('la regla del estado SIGUE aplicando: partido PROGRAMADO → INVALID_OPERATION', async () => {
        partido.estado = EstadoPartido.PROGRAMADO;
        contratosBD = [contratoActivoConLocal()];
        await esperarErrorCase(
          service.actualizar(50, dtoBase()),
          ErrorCase.INVALID_OPERATION,
        );
        noGuarda();
      });

      it('la regla del torneo SIGUE aplicando: torneo FINALIZADO → INVALID_OPERATION', async () => {
        partido.fase.torneo.estado = EstadoTorneo.FINALIZADO;
        contratosBD = [contratoActivoConLocal()];
        await esperarErrorCase(
          service.actualizar(50, dtoBase()),
          ErrorCase.INVALID_OPERATION,
        );
        noGuarda();
      });

      it('si CAMBIA a un jugador inactivo sí lo rechaza (aunque el original esté bien)', async () => {
        jugadoresBD[8] = jugadorBase(8, { activo: false });
        contratosBD = [
          contratoActivoConLocal(7),
          contratoBase(2, jugadoresBD[8], LOCAL()),
        ];
        await esperarErrorCase(
          service.actualizar(50, dtoBase({ jugadorId: 8 })),
          ErrorCase.INVALID_OPERATION,
        );
        noGuarda();
      });
    });
  });

  // ==================================================================================
  describe('eliminar', () => {
    it('lanza NOT_FOUND si la anotación no existe y no borra nada', async () => {
      await esperarErrorCase(service.eliminar(99), ErrorCase.NOT_FOUND);
      expect(anotacionRepo.remove).not.toHaveBeenCalled();
    });

    it('usa remove con la anotación encontrada y responde sin contenido', async () => {
      const a = anotacionBase();
      anotacionesBD = [a];
      await expect(service.eliminar(50)).resolves.toBeUndefined();
      expect(anotacionRepo.remove).toHaveBeenCalledTimes(1);
      expect(anotacionRepo.remove).toHaveBeenCalledWith(a);
      expect(anotacionRepo.delete).not.toHaveBeenCalled();
    });

    it('no toca el partido ni el jugador (6.13: eliminar una anotación no los afecta)', async () => {
      anotacionesBD = [anotacionBase()];
      await service.eliminar(50);
      expect(partidoRepo.save).not.toHaveBeenCalled();
      expect(partidoRepo.remove).not.toHaveBeenCalled();
      expect(partidoRepo.update).not.toHaveBeenCalled();
      expect(partidoRepo.delete).not.toHaveBeenCalled();
      expect(jugadorRepo.save).not.toHaveBeenCalled();
      expect(jugadorRepo.remove).not.toHaveBeenCalled();
      expect(jugadorRepo.update).not.toHaveBeenCalled();
      expect(jugadorRepo.delete).not.toHaveBeenCalled();
    });

    it('no envía correo', async () => {
      anotacionesBD = [anotacionBase()];
      await service.eliminar(50);
      await vaciarPromesas();
      expect(correo.enviar).not.toHaveBeenCalled();
      expect(destinatarios.aficionadosDelPartido).not.toHaveBeenCalled();
    });

    // 6.13: eliminar exige lo mismo que crear y editar.
    it.each([EstadoPartido.PROGRAMADO, EstadoPartido.CANCELADO])(
      'lanza INVALID_OPERATION si el partido está %s y no borra nada',
      async (estado) => {
        partido.estado = estado;
        anotacionesBD = [anotacionBase()];
        await esperarErrorCase(
          service.eliminar(50),
          ErrorCase.INVALID_OPERATION,
        );
        expect(anotacionRepo.remove).not.toHaveBeenCalled();
      },
    );

    it.each([EstadoPartido.EN_JUEGO, EstadoPartido.FINALIZADO])(
      'permite eliminar si el partido está %s',
      async (estado) => {
        partido.estado = estado;
        anotacionesBD = [anotacionBase()];
        await expect(service.eliminar(50)).resolves.toBeUndefined();
        expect(anotacionRepo.remove).toHaveBeenCalledTimes(1);
      },
    );

    it('lanza INVALID_OPERATION si el torneo está FINALIZADO y no borra nada', async () => {
      partido.fase.torneo.estado = EstadoTorneo.FINALIZADO;
      anotacionesBD = [anotacionBase()];
      await esperarErrorCase(service.eliminar(50), ErrorCase.INVALID_OPERATION);
      expect(anotacionRepo.remove).not.toHaveBeenCalled();
    });

    it('un torneo CANCELADO no bloquea el borrado', async () => {
      partido.fase.torneo.estado = EstadoTorneo.CANCELADO;
      anotacionesBD = [anotacionBase()];
      await expect(service.eliminar(50)).resolves.toBeUndefined();
      expect(anotacionRepo.remove).toHaveBeenCalledTimes(1);
    });

    it('el 404 de la anotación gana sobre las reglas de estado', async () => {
      partido.estado = EstadoPartido.CANCELADO;
      await esperarErrorCase(service.eliminar(99), ErrorCase.NOT_FOUND);
    });
  });
});
