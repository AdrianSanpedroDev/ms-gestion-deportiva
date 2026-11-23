// La entidad EquipoJugador (GD-05) importa Equipo de A en tiempo de ejecución.

// JugadorService cuenta HabilidadJugador (de C) y Anotacion (de B). Anotacion → Partido carga en runtime
// Escenario, Fase y RondaFinal (de A y C), que todavía no están en main.

import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Like, Not } from 'typeorm';
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
import { HabilidadJugador } from '../habilidad-jugador/entities/habilidad-jugador.entity';
import { Anotacion } from '../partido/entities/anotacion.entity';
import { CrearJugadorDto } from './dto/crear-jugador.dto';
import { ActualizarJugadorDto } from './dto/actualizar-jugador.dto';
import { EquipoJugador } from './entities/equipo-jugador.entity';
import { Jugador } from './entities/jugador.entity';
import { TipoDocumento } from './entities/tipo-documento.enum';
import { JugadorService } from './jugador.service';

// "Hoy" en Bogotá = 2026-06-15 (UTC-5, sin horario de verano).
const AHORA = new Date('2026-06-15T12:00:00-05:00');

const crearDto = (extra: Partial<CrearJugadorDto> = {}): CrearJugadorDto => ({
  tipoDocumento: 'CC' as TipoDocumento,
  numeroDocumento: '1053000000',
  nombres: 'Juan',
  apellidos: 'Pérez',
  fechaNacimiento: '2000-01-01',
  email: null,
  telefono: null,
  ...extra,
});

const entidad = (extra: Partial<Jugador> = {}): Jugador =>
  ({
    id: 7,
    tipoDocumento: 'CC',
    numeroDocumento: '1053000000',
    nombres: 'Juan',
    apellidos: 'Pérez',
    fechaNacimiento: '2000-01-01',
    email: null,
    telefono: null,
    activo: true,
    // TypeORM 1.1.2 entrega las columnas DATETIME como Date (hidrata con new Date(texto), hora local).
    fechaCreacion: new Date('2026-01-01 10:00:00'),
    ...extra,
  }) as Jugador;

// Comprueba que la promesa se rechaza con ApplicationException del errorCase esperado.
async function esperarErrorCase(
  promesa: Promise<unknown>,
  errorCase: string,
): Promise<void> {
  await expect(promesa).rejects.toBeInstanceOf(ApplicationException);
  await expect(promesa).rejects.toMatchObject({ errorCase });
}

describe('JugadorService', () => {
  let service: JugadorService;
  const repo = {
    findOneBy: jest.fn(),
    existsBy: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
  };
  // Repositorio de contratos (GD-05): el service solo lo consulta para decidir si se puede eliminar.
  const ejRepo = {
    countBy: jest.fn(),
    existsBy: jest.fn(),
    find: jest.fn(),
  };
  // Habilidades asignadas (de C) y anotaciones (de B): el service solo las cuenta para decidir si elimina.
  const hjRepo = { countBy: jest.fn() };
  const anRepo = { countBy: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    jest.setSystemTime(AHORA);

    // Valores por defecto: simulan lo mínimo de TypeORM.
    repo.create.mockImplementation((d: object) => entidad({ id: 1, ...d }));
    repo.save.mockImplementation((e: Jugador) => Promise.resolve(e));
    repo.merge.mockImplementation((e: Jugador, d: object) =>
      Object.assign(e, d),
    );
    repo.remove.mockResolvedValue(undefined);
    // Por defecto el jugador no tiene contratos (cualquiera de las dos formas de consultar).
    ejRepo.countBy.mockResolvedValue(0);
    ejRepo.existsBy.mockResolvedValue(false);
    ejRepo.find.mockResolvedValue([]);
    hjRepo.countBy.mockResolvedValue(0);
    anRepo.countBy.mockResolvedValue(0);

    const modulo = await Test.createTestingModule({
      providers: [
        JugadorService,
        { provide: getRepositoryToken(Jugador), useValue: repo },
        { provide: getRepositoryToken(EquipoJugador), useValue: ejRepo },
        { provide: getRepositoryToken(HabilidadJugador), useValue: hjRepo },
        { provide: getRepositoryToken(Anotacion), useValue: anRepo },
      ],
    }).compile();
    service = modulo.get(JugadorService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('crear', () => {
    it('guarda y devuelve un DTO (no la entidad)', async () => {
      repo.existsBy.mockResolvedValue(false);

      const r = await service.crear(crearDto());

      expect(repo.save).toHaveBeenCalledTimes(1);
      expect(r).not.toBeInstanceOf(Jugador);
      expect(r).toMatchObject({
        id: 1,
        nombreCompleto: 'Juan Pérez',
        activo: true,
      });
      expect(r).toHaveProperty('edad');
      expect(r.fechaCreacion).toBe('2026-01-01T10:00:00');
    });

    it('lanza INVALID_OPERATION si la fecha de nacimiento es hoy', async () => {
      repo.existsBy.mockResolvedValue(false);
      await esperarErrorCase(
        service.crear(crearDto({ fechaNacimiento: '2026-06-15' })),
        ErrorCase.INVALID_OPERATION,
      );
    });

    it('usa la fecha de Bogotá, no la de UTC (21:00 en Bogotá ya es el día siguiente en UTC)', async () => {
      jest.setSystemTime(new Date('2026-06-15T21:00:00-05:00')); // UTC: 2026-06-16 02:00
      repo.existsBy.mockResolvedValue(false);
      // 2026-06-16 es futuro en Bogotá; con UTC se aceptaría por error.
      await esperarErrorCase(
        service.crear(crearDto({ fechaNacimiento: '2026-06-16' })),
        ErrorCase.INVALID_OPERATION,
      );
    });

    it('lanza INVALID_OPERATION si la fecha de nacimiento es futura', async () => {
      repo.existsBy.mockResolvedValue(false);
      await esperarErrorCase(
        service.crear(crearDto({ fechaNacimiento: '2026-06-16' })),
        ErrorCase.INVALID_OPERATION,
      );
    });

    it('acepta una fecha de nacimiento de ayer', async () => {
      repo.existsBy.mockResolvedValue(false);
      await expect(
        service.crear(crearDto({ fechaNacimiento: '2026-06-14' })),
      ).resolves.toBeDefined();
      expect(repo.save).toHaveBeenCalled();
    });

    it('lanza ALREADY_EXISTS si el documento ya está registrado', async () => {
      repo.existsBy.mockResolvedValue(true);
      await esperarErrorCase(
        service.crear(crearDto()),
        ErrorCase.ALREADY_EXISTS,
      );
    });

    it('verifica duplicado con tipoDocumento Y numeroDocumento', async () => {
      repo.existsBy.mockResolvedValue(false);
      await service.crear(
        crearDto({
          tipoDocumento: 'TI' as TipoDocumento,
          numeroDocumento: '999',
        }),
      );
      expect(repo.existsBy).toHaveBeenCalledWith({
        tipoDocumento: 'TI',
        numeroDocumento: '999',
      });
    });

    it('no llama save si la fecha es inválida', async () => {
      repo.existsBy.mockResolvedValue(false);
      await service
        .crear(crearDto({ fechaNacimiento: '2026-06-15' }))
        .catch(() => undefined);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('no llama save si el documento está duplicado', async () => {
      repo.existsBy.mockResolvedValue(true);
      await service.crear(crearDto()).catch(() => undefined);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('sin email ni telefono en el body, guarda null y la respuesta trae las claves en null (contrato 9.7)', async () => {
      repo.existsBy.mockResolvedValue(false);
      // Simula a TypeORM real: create no rellena propiedades que no vienen.
      repo.create.mockImplementation((d: object) => ({
        id: 1,
        activo: true,
        fechaCreacion: new Date('2026-01-01 10:00:00'),
        ...d,
      }));
      const dto = crearDto();
      delete dto.email;
      delete dto.telefono;

      const r = await service.crear(dto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: null, telefono: null }),
      );
      expect(r).toHaveProperty('email', null);
      expect(r).toHaveProperty('telefono', null);
    });

    it('solo copia a la entidad los 7 campos del JugadorRequest (un id o activo de más no pasa)', async () => {
      repo.existsBy.mockResolvedValue(false);
      const conExtras = {
        ...crearDto(),
        id: 99,
        activo: false,
      } as unknown as CrearJugadorDto;

      await service.crear(conExtras);

      const datos = repo.create.mock.calls[0][0];
      expect(datos).not.toHaveProperty('id');
      expect(datos).not.toHaveProperty('activo');
    });
  });

  describe('listar', () => {
    beforeEach(() => repo.find.mockResolvedValue([entidad()]));

    it('sin filtros llama find con where {} y orden por apellidos ASC', async () => {
      const r = await service.listar({});
      expect(repo.find).toHaveBeenCalledWith({
        where: {},
        order: expect.objectContaining({ apellidos: 'ASC' }),
      });
      expect(r).toHaveLength(1);
      expect(r[0]).not.toBeInstanceOf(Jugador);
      expect(r[0].nombreCompleto).toBe('Juan Pérez');
    });

    it('con activo=false filtra por activo false (false no se ignora)', async () => {
      await service.listar({ activo: false });
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { activo: false } }),
      );
    });

    it('con busqueda arma 3 condiciones (nombres, apellidos, numeroDocumento) con Like(%texto%)', async () => {
      await service.listar({ busqueda: 'per' });
      const where = repo.find.mock.calls[0][0].where;
      expect(where).toHaveLength(3);
      expect(where).toEqual([
        { nombres: Like('%per%') },
        { apellidos: Like('%per%') },
        { numeroDocumento: Like('%per%') },
      ]);
    });

    it('con busqueda y activo cada condición lleva activo', async () => {
      await service.listar({ busqueda: 'per', activo: true });
      const where = repo.find.mock.calls[0][0].where;
      expect(where).toEqual([
        { nombres: Like('%per%'), activo: true },
        { apellidos: Like('%per%'), activo: true },
        { numeroDocumento: Like('%per%'), activo: true },
      ]);
    });

    it('escapa los comodines de LIKE: busqueda "_" o "%" se busca literal', async () => {
      await service.listar({ busqueda: '50%_x' });
      const where = repo.find.mock.calls[0][0].where;
      expect(where[0]).toEqual({ nombres: Like('%50\\%\\_x%') });
    });
  });

  describe('obtener', () => {
    it('lanza NOT_FOUND si el jugador no existe', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await esperarErrorCase(service.obtener(99), ErrorCase.NOT_FOUND);
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 99 });
    });

    it('devuelve el DTO si existe', async () => {
      repo.findOneBy.mockResolvedValue(entidad());
      const r = await service.obtener(7);
      expect(r).toMatchObject({ id: 7, nombreCompleto: 'Juan Pérez' });
      expect(r.fechaCreacion).toBe('2026-01-01T10:00:00'); // fixture como Date
    });

    it('también formatea bien una fechaCreacion que llega como texto (dateStrings)', async () => {
      repo.findOneBy.mockResolvedValue(
        entidad({ fechaCreacion: '2026-01-01 10:00:00' as unknown as Date }),
      );
      const r = await service.obtener(7);
      expect(r.fechaCreacion).toBe('2026-01-01T10:00:00');
    });
  });

  describe('actualizar', () => {
    const dto = (
      extra: Partial<ActualizarJugadorDto> = {},
    ): ActualizarJugadorDto => crearDto(extra) as ActualizarJugadorDto;

    it('lanza NOT_FOUND si el jugador no existe', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await esperarErrorCase(
        service.actualizar(99, dto()),
        ErrorCase.NOT_FOUND,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('lanza INVALID_OPERATION si la fecha de nacimiento es futura', async () => {
      repo.findOneBy.mockResolvedValue(entidad());
      repo.existsBy.mockResolvedValue(false);
      await esperarErrorCase(
        service.actualizar(7, dto({ fechaNacimiento: '2026-06-16' })),
        ErrorCase.INVALID_OPERATION,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('lanza INVALID_OPERATION si la fecha de nacimiento es hoy', async () => {
      repo.findOneBy.mockResolvedValue(entidad());
      repo.existsBy.mockResolvedValue(false);
      await esperarErrorCase(
        service.actualizar(7, dto({ fechaNacimiento: '2026-06-15' })),
        ErrorCase.INVALID_OPERATION,
      );
    });

    it('el chequeo de duplicado excluye al propio jugador con id: Not(id)', async () => {
      repo.findOneBy.mockResolvedValue(entidad());
      repo.existsBy.mockResolvedValue(false);
      await service.actualizar(7, dto());
      expect(repo.existsBy).toHaveBeenCalledWith({
        tipoDocumento: 'CC',
        numeroDocumento: '1053000000',
        id: Not(7),
      });
    });

    it('lanza ALREADY_EXISTS si otro jugador tiene ese documento', async () => {
      repo.findOneBy.mockResolvedValue(entidad());
      repo.existsBy.mockResolvedValue(true);
      await esperarErrorCase(
        service.actualizar(7, dto()),
        ErrorCase.ALREADY_EXISTS,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('caso feliz: hace merge y save y devuelve el DTO actualizado', async () => {
      const actual = entidad();
      repo.findOneBy.mockResolvedValue(actual);
      repo.existsBy.mockResolvedValue(false);
      const nuevo = dto({ nombres: 'Juanito', telefono: '3001234567' });

      const r = await service.actualizar(7, nuevo);

      expect(repo.merge).toHaveBeenCalledWith(actual, nuevo);
      expect(repo.save).toHaveBeenCalledWith(actual);
      expect(r).toMatchObject({
        id: 7,
        nombres: 'Juanito',
        telefono: '3001234567',
      });
    });
  });

  describe('cambiarEstado', () => {
    it('desactiva un jugador activo', async () => {
      repo.findOneBy.mockResolvedValue(entidad({ activo: true }));
      const r = await service.cambiarEstado(7, false);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 7, activo: false }),
      );
      expect(r.activo).toBe(false);
    });

    it('reactiva un jugador inactivo', async () => {
      repo.findOneBy.mockResolvedValue(entidad({ activo: false }));
      const r = await service.cambiarEstado(7, true);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ activo: true }),
      );
      expect(r.activo).toBe(true);
    });

    it('lanza NOT_FOUND si el jugador no existe', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await esperarErrorCase(
        service.cambiarEstado(99, false),
        ErrorCase.NOT_FOUND,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('eliminar', () => {
    it('lanza NOT_FOUND si el jugador no existe', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await esperarErrorCase(service.eliminar(99), ErrorCase.NOT_FOUND);
      expect(repo.remove).not.toHaveBeenCalled();
    });

    it('llama remove con la entidad en el caso feliz', async () => {
      const j = entidad();
      repo.findOneBy.mockResolvedValue(j);
      await expect(service.eliminar(7)).resolves.toBeUndefined();
      expect(repo.remove).toHaveBeenCalledWith(j);
    });

    it('lanza HAS_ASSOCIATIONS si el jugador tiene contratos, y el mensaje incluye el número', async () => {
      repo.findOneBy.mockResolvedValue(entidad());
      // Simula 3 contratos (activos o históricos: cualquier fila de equipo_jugador cuenta, 6.4).
      ejRepo.countBy.mockResolvedValue(3);
      ejRepo.existsBy.mockResolvedValue(true);
      ejRepo.find.mockResolvedValue([{}, {}, {}]);

      const promesa = service.eliminar(7);

      await esperarErrorCase(promesa, ErrorCase.HAS_ASSOCIATIONS);
      await expect(promesa).rejects.toThrow(/3/);
      expect(repo.remove).not.toHaveBeenCalled();
    });

    it('cuenta los contratos del jugador por su id (activos e históricos, sin filtrar por activo)', async () => {
      repo.findOneBy.mockResolvedValue(entidad());
      await service.eliminar(7);
      expect(ejRepo.countBy).toHaveBeenCalledWith({ jugador: { id: 7 } });
    });

    it('elimina (remove) si el jugador no tiene contratos', async () => {
      const j = entidad();
      repo.findOneBy.mockResolvedValue(j);
      ejRepo.countBy.mockResolvedValue(0);
      await expect(service.eliminar(7)).resolves.toBeUndefined();
      expect(repo.remove).toHaveBeenCalledWith(j);
    });

    it('lanza HAS_ASSOCIATIONS si el jugador tiene habilidades asignadas, con el número, y no llama remove', async () => {
      repo.findOneBy.mockResolvedValue(entidad());
      hjRepo.countBy.mockResolvedValue(2);

      const promesa = service.eliminar(7);

      await esperarErrorCase(promesa, ErrorCase.HAS_ASSOCIATIONS);
      await expect(promesa).rejects.toThrow(/2/);
      expect(hjRepo.countBy).toHaveBeenCalledWith({ jugador: { id: 7 } });
      expect(repo.remove).not.toHaveBeenCalled();
    });

    it('lanza HAS_ASSOCIATIONS si el jugador tiene anotaciones, con el número, y no llama remove', async () => {
      repo.findOneBy.mockResolvedValue(entidad());
      anRepo.countBy.mockResolvedValue(4);

      const promesa = service.eliminar(7);

      await esperarErrorCase(promesa, ErrorCase.HAS_ASSOCIATIONS);
      await expect(promesa).rejects.toThrow(/4/);
      expect(anRepo.countBy).toHaveBeenCalledWith({ jugador: { id: 7 } });
      expect(repo.remove).not.toHaveBeenCalled();
    });
  });
});
