import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
import { Equipo } from '../equipo/entities/equipo.entity';
import { CrearContratoDto } from './dto/crear-contrato.dto';
import { EquipoJugador } from './entities/equipo-jugador.entity';
import { Jugador } from './entities/jugador.entity';
import { EquipoJugadorService } from './equipo-jugador.service';

// "Hoy" en Bogotá = 2026-06-15 (UTC-5, sin horario de verano).
const AHORA = new Date('2026-06-15T12:00:00-05:00');

const equipo = (extra: Partial<Equipo> = {}): Equipo =>
  ({ id: 4, nombre: 'Once Caldas', activo: true, ...extra }) as Equipo;

const jugador = (extra: Partial<Jugador> = {}): Jugador =>
  ({
    id: 7,
    tipoDocumento: 'CC',
    numeroDocumento: '1053000000',
    nombres: 'Juan',
    apellidos: 'Pérez',
    activo: true,
    ...extra,
  }) as Jugador;

const contrato = (extra: Partial<EquipoJugador> = {}): EquipoJugador =>
  ({
    id: 15,
    equipo: equipo(),
    jugador: jugador(),
    fechaInicio: '2026-01-01',
    fechaFin: '2027-12-31',
    fechaRetiro: null,
    activo: true,
    ...extra,
  }) as EquipoJugador;

const crearDto = (extra: Partial<CrearContratoDto> = {}): CrearContratoDto => ({
  jugadorId: 7,
  fechaInicio: '2026-01-01',
  fechaFin: '2027-12-31',
  ...extra,
});

// Comprueba que la promesa se rechaza con ApplicationException del errorCase esperado.
async function esperarErrorCase(
  promesa: Promise<unknown>,
  errorCase: string,
): Promise<void> {
  await expect(promesa).rejects.toBeInstanceOf(ApplicationException);
  await expect(promesa).rejects.toMatchObject({ errorCase });
}

describe('EquipoJugadorService', () => {
  let service: EquipoJugadorService;
  const ejRepo = {
    existsBy: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };
  const jugadorRepo = { findOneBy: jest.fn() };
  const equipoRepo = { findOneBy: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    jest.setSystemTime(AHORA);

    // Valores por defecto: equipo y jugador existen y están activos; no hay contrato previo.
    equipoRepo.findOneBy.mockResolvedValue(equipo());
    jugadorRepo.findOneBy.mockResolvedValue(jugador());
    ejRepo.existsBy.mockResolvedValue(false);
    ejRepo.find.mockResolvedValue([]);
    // Simula lo mínimo de TypeORM: create no toca la BD; save devuelve la entidad con id.
    ejRepo.create.mockImplementation((d: object) => contrato({ id: 15, ...d }));
    ejRepo.save.mockImplementation((e: EquipoJugador) => Promise.resolve(e));

    const modulo = await Test.createTestingModule({
      providers: [
        EquipoJugadorService,
        { provide: getRepositoryToken(EquipoJugador), useValue: ejRepo },
        { provide: getRepositoryToken(Jugador), useValue: jugadorRepo },
        { provide: getRepositoryToken(Equipo), useValue: equipoRepo },
      ],
    }).compile();
    service = modulo.get(EquipoJugadorService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('asignar', () => {
    it('lanza NOT_FOUND si el equipo no existe', async () => {
      equipoRepo.findOneBy.mockResolvedValue(null);
      await esperarErrorCase(
        service.asignar(99, crearDto()),
        ErrorCase.NOT_FOUND,
      );
      expect(equipoRepo.findOneBy).toHaveBeenCalledWith({ id: 99 });
      expect(ejRepo.save).not.toHaveBeenCalled();
    });

    it('lanza NOT_FOUND si el jugador no existe', async () => {
      jugadorRepo.findOneBy.mockResolvedValue(null);
      await esperarErrorCase(
        service.asignar(4, crearDto({ jugadorId: 99 })),
        ErrorCase.NOT_FOUND,
      );
      expect(jugadorRepo.findOneBy).toHaveBeenCalledWith({ id: 99 });
      expect(ejRepo.save).not.toHaveBeenCalled();
    });

    it('lanza NOT_FOUND (no INVALID_OPERATION) si el jugador no existe y el equipo está inactivo: primero existencia, luego actividad', async () => {
      equipoRepo.findOneBy.mockResolvedValue(equipo({ activo: false }));
      jugadorRepo.findOneBy.mockResolvedValue(null);
      await esperarErrorCase(
        service.asignar(4, crearDto({ jugadorId: 99 })),
        ErrorCase.NOT_FOUND,
      );
      expect(ejRepo.save).not.toHaveBeenCalled();
    });

    it('lanza INVALID_OPERATION si el equipo está inactivo', async () => {
      equipoRepo.findOneBy.mockResolvedValue(equipo({ activo: false }));
      await esperarErrorCase(
        service.asignar(4, crearDto()),
        ErrorCase.INVALID_OPERATION,
      );
      expect(ejRepo.save).not.toHaveBeenCalled();
    });

    it('lanza INVALID_OPERATION si el jugador está inactivo', async () => {
      jugadorRepo.findOneBy.mockResolvedValue(jugador({ activo: false }));
      await esperarErrorCase(
        service.asignar(4, crearDto()),
        ErrorCase.INVALID_OPERATION,
      );
      expect(ejRepo.save).not.toHaveBeenCalled();
    });

    it('lanza INVALID_OPERATION si fechaFin es IGUAL a fechaInicio (debe ser mayor, no mayor o igual)', async () => {
      await esperarErrorCase(
        service.asignar(
          4,
          crearDto({ fechaInicio: '2026-06-15', fechaFin: '2026-06-15' }),
        ),
        ErrorCase.INVALID_OPERATION,
      );
      expect(ejRepo.save).not.toHaveBeenCalled();
    });

    it('lanza INVALID_OPERATION si fechaFin es anterior a fechaInicio', async () => {
      await esperarErrorCase(
        service.asignar(
          4,
          crearDto({ fechaInicio: '2026-06-15', fechaFin: '2026-06-14' }),
        ),
        ErrorCase.INVALID_OPERATION,
      );
      expect(ejRepo.save).not.toHaveBeenCalled();
    });

    it('acepta fechaFin un día después de fechaInicio', async () => {
      await expect(
        service.asignar(
          4,
          crearDto({ fechaInicio: '2026-06-15', fechaFin: '2026-06-16' }),
        ),
      ).resolves.toBeDefined();
      expect(ejRepo.save).toHaveBeenCalledTimes(1);
    });

    it('compara las fechas como fechas, no como números sueltos (mes/año cruzados)', async () => {
      // 2026-12-31 (inicio) < 2027-01-01 (fin): válido aunque el día de fin (01) sea menor que el de inicio (31).
      await expect(
        service.asignar(
          4,
          crearDto({ fechaInicio: '2026-12-31', fechaFin: '2027-01-01' }),
        ),
      ).resolves.toBeDefined();
    });

    it('lanza ALREADY_EXISTS si el jugador ya tiene un contrato ACTIVO con ese equipo', async () => {
      ejRepo.existsBy.mockResolvedValue(true);
      await esperarErrorCase(
        service.asignar(4, crearDto()),
        ErrorCase.ALREADY_EXISTS,
      );
      expect(ejRepo.save).not.toHaveBeenCalled();
    });

    it('el chequeo de duplicado mira solo contratos activos de ESTE equipo y ESTE jugador (un retirado puede volver a firmar)', async () => {
      await service.asignar(4, crearDto({ jugadorId: 7 }));
      expect(ejRepo.existsBy).toHaveBeenCalledWith(
        expect.objectContaining({
          equipo: { id: 4 },
          jugador: { id: 7 },
          activo: true,
        }),
      );
    });

    it('un jugador con un contrato YA RETIRADO con el mismo equipo puede volver a firmar (no da 409)', async () => {
      // Simula la BD: solo existe un contrato retirado (activo=false) de la misma pareja equipo+jugador.
      const retirado = contrato({
        id: 10,
        activo: false,
        fechaRetiro: '2026-03-01',
      });
      ejRepo.existsBy.mockImplementation(
        (donde: {
          equipo?: { id: number };
          jugador?: { id: number };
          activo?: boolean;
        }) =>
          Promise.resolve(
            [retirado].some(
              (c) =>
                c.equipo.id === donde.equipo?.id &&
                c.jugador.id === donde.jugador?.id &&
                (donde.activo === undefined || c.activo === donde.activo),
            ),
          ),
      );

      const r = await service.asignar(4, crearDto({ jugadorId: 7 }));

      expect(ejRepo.save).toHaveBeenCalledTimes(1);
      expect(r.activo).toBe(true);
      expect(r.fechaRetiro).toBeNull();
    });

    it('caso feliz: guarda UNA vez y devuelve el ContratoResponse (9.8) con fechaRetiro null y activo true', async () => {
      const r = await service.asignar(4, crearDto());

      expect(ejRepo.save).toHaveBeenCalledTimes(1);
      expect(r).not.toBeInstanceOf(EquipoJugador);
      expect(r).toEqual({
        id: 15,
        jugador: {
          id: 7,
          tipoDocumento: 'CC',
          numeroDocumento: '1053000000',
          nombreCompleto: 'Juan Pérez',
          activo: true,
        },
        equipo: { id: 4, nombre: 'Once Caldas', activo: true },
        fechaInicio: '2026-01-01',
        fechaFin: '2027-12-31',
        fechaRetiro: null,
        activo: true,
      });
    });

    it('el contrato nuevo se guarda activo y sin fecha de retiro', async () => {
      await service.asignar(4, crearDto());
      const guardado = ejRepo.save.mock.calls[0][0];
      expect(guardado.activo).toBe(true);
      expect(guardado.fechaRetiro ?? null).toBeNull();
    });

    it('permite contrato con otro equipo aunque el jugador ya esté activo en uno (solo se compara la pareja equipo+jugador)', async () => {
      // No hay contrato activo con el equipo 5 (existsBy=false por defecto): debe crearse.
      equipoRepo.findOneBy.mockResolvedValue(equipo({ id: 5, nombre: 'Otro' }));
      await expect(service.asignar(5, crearDto())).resolves.toMatchObject({
        equipo: { id: 5 },
      });
    });
  });

  describe('listarPorEquipo', () => {
    it('lanza NOT_FOUND si el equipo no existe', async () => {
      equipoRepo.findOneBy.mockResolvedValue(null);
      await esperarErrorCase(service.listarPorEquipo(99), ErrorCase.NOT_FOUND);
      expect(ejRepo.find).not.toHaveBeenCalled();
    });

    it('por defecto (sin incluirHistorial) filtra solo contratos activos del equipo', async () => {
      await service.listarPorEquipo(4);
      const opciones = ejRepo.find.mock.calls[0][0];
      expect(opciones.where).toMatchObject({ equipo: { id: 4 }, activo: true });
    });

    it('con incluirHistorial=false también filtra solo activos', async () => {
      await service.listarPorEquipo(4, false);
      expect(ejRepo.find.mock.calls[0][0].where).toMatchObject({
        activo: true,
      });
    });

    it('con incluirHistorial=true NO filtra por activo (devuelve todos)', async () => {
      await service.listarPorEquipo(4, true);
      const where = ejRepo.find.mock.calls[0][0].where;
      expect(where).toMatchObject({ equipo: { id: 4 } });
      expect(where).not.toHaveProperty('activo');
    });

    it('ordena del más reciente al más antiguo (fechaInicio DESC)', async () => {
      await service.listarPorEquipo(4, true);
      expect(ejRepo.find.mock.calls[0][0].order).toMatchObject({
        fechaInicio: 'DESC',
      });
    });

    it('devuelve DTOs (no entidades) con jugador y equipo resumidos', async () => {
      ejRepo.find.mockResolvedValue([contrato()]);
      const r = await service.listarPorEquipo(4);
      expect(r).toHaveLength(1);
      expect(r[0]).not.toBeInstanceOf(EquipoJugador);
      expect(r[0].jugador.nombreCompleto).toBe('Juan Pérez');
      expect(r[0].equipo.nombre).toBe('Once Caldas');
    });

    it('sin contratos devuelve un arreglo vacío (no lanza)', async () => {
      await expect(service.listarPorEquipo(4)).resolves.toEqual([]);
    });
  });

  describe('listarPorJugador', () => {
    it('lanza NOT_FOUND si el jugador no existe', async () => {
      jugadorRepo.findOneBy.mockResolvedValue(null);
      await esperarErrorCase(service.listarPorJugador(99), ErrorCase.NOT_FOUND);
      expect(ejRepo.find).not.toHaveBeenCalled();
    });

    it('por defecto filtra solo contratos activos del jugador', async () => {
      await service.listarPorJugador(7);
      expect(ejRepo.find.mock.calls[0][0].where).toMatchObject({
        jugador: { id: 7 },
        activo: true,
      });
    });

    it('con incluirHistorial=true NO filtra por activo (traspasos pasados incluidos)', async () => {
      await service.listarPorJugador(7, true);
      const where = ejRepo.find.mock.calls[0][0].where;
      expect(where).toMatchObject({ jugador: { id: 7 } });
      expect(where).not.toHaveProperty('activo');
    });

    it('ordena del más reciente al más antiguo (fechaInicio DESC)', async () => {
      await service.listarPorJugador(7, true);
      expect(ejRepo.find.mock.calls[0][0].order).toMatchObject({
        fechaInicio: 'DESC',
      });
    });

    it('devuelve DTOs (no entidades)', async () => {
      ejRepo.find.mockResolvedValue([contrato(), contrato({ id: 16 })]);
      const r = await service.listarPorJugador(7, true);
      expect(r.map((c) => c.id)).toEqual([15, 16]);
      expect(r[0]).not.toBeInstanceOf(EquipoJugador);
    });
  });

  describe('retirar', () => {
    // Supuesto de la prueba: el service busca el contrato ACTIVO de la pareja con findOne.
    const simularContrato = (c: EquipoJugador | null) => {
      ejRepo.findOne.mockResolvedValue(c);
      ejRepo.findOneBy.mockResolvedValue(c);
    };

    it('lanza NOT_FOUND si no hay contrato activo para esa pareja equipo+jugador', async () => {
      simularContrato(null);
      await esperarErrorCase(service.retirar(4, 7, {}), ErrorCase.NOT_FOUND);
      expect(ejRepo.save).not.toHaveBeenCalled();
    });

    it('busca solo entre contratos ACTIVOS (uno ya retirado no se puede retirar otra vez)', async () => {
      simularContrato(contrato());
      await service.retirar(4, 7, {});
      const where = ejRepo.findOne.mock.calls[0][0].where;
      expect(where).toMatchObject({
        equipo: { id: 4 },
        jugador: { id: 7 },
        activo: true,
      });
    });

    it('pone activo=false y guarda (UPDATE), nunca borra la fila', async () => {
      const c = contrato();
      simularContrato(c);

      const r = await service.retirar(4, 7, {});

      expect(ejRepo.save).toHaveBeenCalledTimes(1);
      expect(ejRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 15, activo: false }),
      );
      expect(ejRepo.remove).not.toHaveBeenCalled();
      expect(ejRepo.delete).not.toHaveBeenCalled();
      expect(r.activo).toBe(false);
    });

    it('si llega fechaRetiro, usa esa fecha', async () => {
      simularContrato(contrato());
      const r = await service.retirar(4, 7, { fechaRetiro: '2026-12-01' });
      expect(ejRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ fechaRetiro: '2026-12-01' }),
      );
      expect(r.fechaRetiro).toBe('2026-12-01');
    });

    it('si no llega fechaRetiro, usa la fecha de hoy (2026-06-15)', async () => {
      simularContrato(contrato());
      const r = await service.retirar(4, 7, {});
      expect(r.fechaRetiro).toBe('2026-06-15');
    });

    it('si fechaRetiro llega null, usa la fecha de hoy', async () => {
      simularContrato(contrato());
      const r = await service.retirar(4, 7, { fechaRetiro: null });
      expect(r.fechaRetiro).toBe('2026-06-15');
    });

    it('"hoy" es la fecha de Bogotá, no la de UTC (21:00 en Bogotá ya es el día siguiente en UTC)', async () => {
      jest.setSystemTime(new Date('2026-06-15T21:00:00-05:00')); // UTC: 2026-06-16 02:00
      simularContrato(contrato());
      const r = await service.retirar(4, 7, {});
      expect(r.fechaRetiro).toBe('2026-06-15');
    });

    it('devuelve un ContratoResponse (DTO), no la entidad', async () => {
      simularContrato(contrato());
      const r = await service.retirar(4, 7, {});
      expect(r).not.toBeInstanceOf(EquipoJugador);
      expect(r).toMatchObject({
        id: 15,
        jugador: { id: 7, nombreCompleto: 'Juan Pérez' },
        equipo: { id: 4, nombre: 'Once Caldas' },
      });
    });
  });
});
