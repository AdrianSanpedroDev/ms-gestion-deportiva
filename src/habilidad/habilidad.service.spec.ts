// =====================================================================================
// TEMPORAL: quitar los jest.mock virtuales cuando A suba common/errores
// (application.exception.ts y error-case.enum.ts). Al quitarlos, importar las clases reales.
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

// HabilidadJugador es de C y todavía no está en main.
jest.mock(
  '../habilidad-jugador/entities/habilidad-jugador.entity',
  () => ({ HabilidadJugador: class HabilidadJugador {} }),
  { virtual: true },
);

import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FindOperator } from 'typeorm';
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
import { HabilidadJugador } from '../habilidad-jugador/entities/habilidad-jugador.entity';
import { CrearHabilidadDto } from './dto/crear-habilidad.dto';
import { ActualizarHabilidadDto } from './dto/actualizar-habilidad.dto';
import { CategoriaHabilidad } from './entities/categoria-habilidad.enum';
import { Habilidad } from './entities/habilidad.entity';
import { HabilidadService } from './habilidad.service';

const crearDto = (
  extra: Partial<CrearHabilidadDto> = {},
): CrearHabilidadDto => ({
  nombre: 'Regate',
  descripcion: 'Capacidad de eludir rivales',
  categoria: CategoriaHabilidad.TECNICA,
  ...extra,
});

const entidad = (extra: Partial<Habilidad> = {}): Habilidad =>
  ({
    id: 2,
    nombre: 'Regate',
    descripcion: 'Capacidad de eludir rivales',
    categoria: CategoriaHabilidad.TECNICA,
    // TypeORM 1.1.2 entrega las columnas DATETIME como Date (hidrata con new Date(texto), hora local).
    fechaCreacion: new Date('2026-11-20 10:00:00'),
    ...extra,
  }) as Habilidad;

async function esperarErrorCase(
  promesa: Promise<unknown>,
  errorCase: string,
): Promise<void> {
  await expect(promesa).rejects.toBeInstanceOf(ApplicationException);
  await expect(promesa).rejects.toMatchObject({ errorCase });
}

describe('HabilidadService', () => {
  let service: HabilidadService;
  const repo = {
    findOneBy: jest.fn(),
    existsBy: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    merge: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  // Asignaciones habilidad-jugador (de C): el service solo las cuenta.
  const hjRepo = { countBy: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    hjRepo.countBy.mockResolvedValue(0);
    // Comportamiento real mínimo de create/merge/save para poder comprobar resultados.
    repo.create.mockImplementation((datos: Partial<Habilidad>) => ({
      ...datos,
    }));
    repo.merge.mockImplementation(
      (destino: Habilidad, datos: Partial<Habilidad>) =>
        Object.assign(destino, datos),
    );
    // Como TypeORM: save() completa id y fechaCreacion SOBRE el mismo objeto.
    // fechaCreacion queda como Date (la columna DATETIME se hidrata con new Date), no como texto.
    repo.save.mockImplementation((e: Habilidad) => {
      e.id = e.id ?? 2;
      e.fechaCreacion = e.fechaCreacion ?? new Date('2026-11-20 10:00:00');
      return Promise.resolve(e);
    });

    const modulo = await Test.createTestingModule({
      providers: [
        HabilidadService,
        { provide: getRepositoryToken(Habilidad), useValue: repo },
        { provide: getRepositoryToken(HabilidadJugador), useValue: hjRepo },
      ],
    }).compile();
    service = modulo.get(HabilidadService);
  });

  describe('crear', () => {
    it('lanza ALREADY_EXISTS si el nombre ya está registrado y no llama save', async () => {
      repo.existsBy.mockResolvedValue(true);
      await esperarErrorCase(
        service.crear(crearDto()),
        ErrorCase.ALREADY_EXISTS,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('busca el duplicado por nombre', async () => {
      repo.existsBy.mockResolvedValue(false);
      await service.crear(crearDto());
      expect(repo.existsBy).toHaveBeenCalledWith({ nombre: 'Regate' });
    });

    it('guarda y devuelve un DTO de respuesta, no la entidad', async () => {
      repo.existsBy.mockResolvedValue(false);
      const r = await service.crear(crearDto());
      expect(repo.save).toHaveBeenCalledTimes(1);
      expect(r).toEqual({
        id: 2,
        nombre: 'Regate',
        descripcion: 'Capacidad de eludir rivales',
        categoria: 'TECNICA',
        fechaCreacion: '2026-11-20T10:00:00',
      });
    });

    it('guarda descripcion null si no viene', async () => {
      repo.existsBy.mockResolvedValue(false);
      await service.crear(crearDto({ descripcion: undefined }));
      const guardado = repo.save.mock.calls[0][0] as Habilidad;
      expect(guardado.descripcion).toBeNull();
    });
  });

  describe('listar', () => {
    it('sin filtros devuelve todo ordenado por nombre ASC', async () => {
      repo.find.mockResolvedValue([entidad()]);
      const r = await service.listar({});
      const opciones = repo.find.mock.calls[0][0];
      expect(opciones.where).toEqual({});
      expect(opciones.order).toEqual({ nombre: 'ASC' });
      expect(r).toHaveLength(1);
      expect(r[0].fechaCreacion).toBe('2026-11-20T10:00:00');
    });

    it('filtro nombre = contiene (Like %texto%)', async () => {
      repo.find.mockResolvedValue([]);
      await service.listar({ nombre: 'reg' });
      const nombre = repo.find.mock.calls[0][0].where
        .nombre as FindOperator<string>;
      expect(nombre).toBeInstanceOf(FindOperator);
      expect(nombre.type).toBe('like');
      expect(nombre.value).toBe('%reg%');
    });

    it('escapa los comodines % y _ del texto buscado', async () => {
      repo.find.mockResolvedValue([]);
      await service.listar({ nombre: '50%_x' });
      const nombre = repo.find.mock.calls[0][0].where
        .nombre as FindOperator<string>;
      expect(nombre.value).toBe('%50\\%\\_x%');
    });

    it('filtro categoria: igualdad exacta y sin filtro de nombre', async () => {
      repo.find.mockResolvedValue([]);
      await service.listar({ categoria: CategoriaHabilidad.FISICA });
      const where = repo.find.mock.calls[0][0].where;
      expect(where.categoria).toBe('FISICA');
      expect(where.nombre).toBeUndefined();
    });

    it('nombre y categoria juntos van en el mismo where (AND)', async () => {
      repo.find.mockResolvedValue([]);
      await service.listar({
        nombre: 'reg',
        categoria: CategoriaHabilidad.TECNICA,
      });
      const where = repo.find.mock.calls[0][0].where;
      expect(where.nombre).toBeInstanceOf(FindOperator);
      expect(where.categoria).toBe('TECNICA');
    });

    it('categoria undefined (query vacío) no filtra', async () => {
      repo.find.mockResolvedValue([]);
      await service.listar({ categoria: undefined });
      expect(repo.find.mock.calls[0][0].where.categoria).toBeUndefined();
    });
  });

  describe('obtener', () => {
    it('lanza NOT_FOUND si findOneBy devuelve null', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await esperarErrorCase(service.obtener(99), ErrorCase.NOT_FOUND);
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 99 });
    });

    it('devuelve el DTO de respuesta si existe', async () => {
      repo.findOneBy.mockResolvedValue(entidad());
      const r = await service.obtener(2);
      expect(r.id).toBe(2);
      expect(r.fechaCreacion).toBe('2026-11-20T10:00:00');
    });

    it('también formatea bien una fechaCreacion que llega como texto (dateStrings)', async () => {
      repo.findOneBy.mockResolvedValue(
        entidad({
          fechaCreacion: '2026-11-20 10:00:00' as unknown as Date,
        }),
      );
      const r = await service.obtener(2);
      expect(r.fechaCreacion).toBe('2026-11-20T10:00:00');
    });
  });

  describe('actualizar', () => {
    const dto = (extra: Partial<ActualizarHabilidadDto> = {}) =>
      crearDto({ nombre: 'Pase', ...extra });

    it('lanza NOT_FOUND si la habilidad no existe y no guarda', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await esperarErrorCase(
        service.actualizar(99, dto()),
        ErrorCase.NOT_FOUND,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('lanza ALREADY_EXISTS si OTRA habilidad tiene ese nombre', async () => {
      repo.findOneBy.mockResolvedValue(entidad());
      repo.existsBy.mockResolvedValue(true);
      await esperarErrorCase(
        service.actualizar(2, dto()),
        ErrorCase.ALREADY_EXISTS,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('la verificación de duplicado excluye el propio id (Not(id))', async () => {
      repo.findOneBy.mockResolvedValue(entidad());
      repo.existsBy.mockResolvedValue(false);
      await service.actualizar(2, dto());
      const where = repo.existsBy.mock.calls[0][0];
      expect(where.nombre).toBe('Pase');
      expect(where.id).toBeInstanceOf(FindOperator);
      expect(where.id.type).toBe('not');
      expect(where.id.value).toBe(2);
    });

    it('actualiza y devuelve el DTO con los datos nuevos', async () => {
      repo.findOneBy.mockResolvedValue(entidad());
      repo.existsBy.mockResolvedValue(false);
      const r = await service.actualizar(
        2,
        dto({ categoria: CategoriaHabilidad.MENTAL }),
      );
      expect(repo.save).toHaveBeenCalledTimes(1);
      expect(r.id).toBe(2);
      expect(r.nombre).toBe('Pase');
      expect(r.categoria).toBe('MENTAL');
      expect(r.fechaCreacion).toBe('2026-11-20T10:00:00');
    });
  });

  describe('eliminar', () => {
    it('lanza NOT_FOUND si la habilidad no existe y no borra', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await esperarErrorCase(service.eliminar(99), ErrorCase.NOT_FOUND);
      expect(repo.remove).not.toHaveBeenCalled();
    });

    it('borra físicamente la habilidad (remove) si existe', async () => {
      const h = entidad();
      repo.findOneBy.mockResolvedValue(h);
      repo.remove.mockResolvedValue(h);
      await service.eliminar(2);
      expect(repo.remove).toHaveBeenCalledWith(h);
    });

    it('lanza HAS_ASSOCIATIONS si está asignada a jugadores, con el número, y no borra', async () => {
      repo.findOneBy.mockResolvedValue(entidad());
      hjRepo.countBy.mockResolvedValue(3);

      const promesa = service.eliminar(2);

      await esperarErrorCase(promesa, ErrorCase.HAS_ASSOCIATIONS);
      await expect(promesa).rejects.toThrow(/asignada a 3 jugador\(es\)/);
      expect(hjRepo.countBy).toHaveBeenCalledWith({ habilidad: { id: 2 } });
      expect(repo.remove).not.toHaveBeenCalled();
    });
  });
});
