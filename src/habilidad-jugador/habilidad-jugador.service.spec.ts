import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
import { CategoriaHabilidad } from '../habilidad/entities/categoria-habilidad.enum';
import { Habilidad } from '../habilidad/entities/habilidad.entity';
import { Jugador } from '../jugador/entities/jugador.entity';
import { TipoDocumento } from '../jugador/entities/tipo-documento.enum';
import { HabilidadJugador } from './entities/habilidad-jugador.entity';
import { HabilidadJugadorService } from './habilidad-jugador.service';

const jugador = (extra: Partial<Jugador> = {}): Jugador =>
  ({
    id: 7,
    tipoDocumento: TipoDocumento.CC,
    numeroDocumento: '1053000000',
    nombres: 'Juan',
    apellidos: 'Pérez',
    activo: true,
    ...extra,
  }) as Jugador;

const habilidad = (extra: Partial<Habilidad> = {}): Habilidad =>
  ({
    id: 2,
    nombre: 'Regate',
    descripcion: 'Capacidad de eludir rivales',
    categoria: CategoriaHabilidad.TECNICA,
    ...extra,
  }) as Habilidad;

const asignacion = (extra: Partial<HabilidadJugador> = {}): HabilidadJugador =>
  ({
    id: 10,
    jugador: jugador(),
    habilidad: habilidad(),
    fechaAsignacion: new Date('2026-11-22T15:00:00'),
    ...extra,
  }) as HabilidadJugador;

async function esperarErrorCase(
  promesa: Promise<unknown>,
  errorCase: string,
): Promise<void> {
  await expect(promesa).rejects.toBeInstanceOf(ApplicationException);
  await expect(promesa).rejects.toMatchObject({ errorCase });
}

describe('HabilidadJugadorService', () => {
  let service: HabilidadJugadorService;

  const hjRepo = {
    existsBy: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const jugadorRepo = {
    findOneBy: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };
  const habilidadRepo = {
    findOneBy: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    jugadorRepo.findOneBy.mockResolvedValue(jugador());
    habilidadRepo.findOneBy.mockResolvedValue(habilidad());
    hjRepo.existsBy.mockResolvedValue(false);
    hjRepo.find.mockResolvedValue([]);
    hjRepo.create.mockImplementation((datos: Partial<HabilidadJugador>) =>
      asignacion({ id: 10, ...datos }),
    );
    hjRepo.save.mockImplementation((e: HabilidadJugador) => Promise.resolve(e));
    hjRepo.remove.mockImplementation((e: HabilidadJugador) =>
      Promise.resolve(e),
    );

    const modulo = await Test.createTestingModule({
      providers: [
        HabilidadJugadorService,
        { provide: getRepositoryToken(HabilidadJugador), useValue: hjRepo },
        { provide: getRepositoryToken(Jugador), useValue: jugadorRepo },
        { provide: getRepositoryToken(Habilidad), useValue: habilidadRepo },
      ],
    }).compile();

    service = modulo.get(HabilidadJugadorService);
  });

  describe('asignar', () => {
    it('lanza NOT_FOUND si el jugador no existe', async () => {
      jugadorRepo.findOneBy.mockResolvedValue(null);

      await esperarErrorCase(
        service.asignar(99, { habilidadId: 2 }),
        ErrorCase.NOT_FOUND,
      );

      expect(jugadorRepo.findOneBy).toHaveBeenCalledWith({ id: 99 });
      expect(hjRepo.save).not.toHaveBeenCalled();
    });

    it('lanza NOT_FOUND si la habilidad no existe', async () => {
      habilidadRepo.findOneBy.mockResolvedValue(null);

      await esperarErrorCase(
        service.asignar(7, { habilidadId: 99 }),
        ErrorCase.NOT_FOUND,
      );

      expect(habilidadRepo.findOneBy).toHaveBeenCalledWith({ id: 99 });
      expect(hjRepo.save).not.toHaveBeenCalled();
    });

    it('prioriza NOT_FOUND de habilidad inexistente sobre jugador inactivo', async () => {
      jugadorRepo.findOneBy.mockResolvedValue(jugador({ activo: false }));
      habilidadRepo.findOneBy.mockResolvedValue(null);

      await esperarErrorCase(
        service.asignar(7, { habilidadId: 99 }),
        ErrorCase.NOT_FOUND,
      );

      expect(hjRepo.save).not.toHaveBeenCalled();
    });

    it('lanza INVALID_OPERATION si el jugador está inactivo', async () => {
      jugadorRepo.findOneBy.mockResolvedValue(jugador({ activo: false }));

      await esperarErrorCase(
        service.asignar(7, { habilidadId: 2 }),
        ErrorCase.INVALID_OPERATION,
      );

      expect(hjRepo.save).not.toHaveBeenCalled();
    });

    it('lanza ALREADY_EXISTS si el jugador ya tiene asignada la misma habilidad', async () => {
      hjRepo.existsBy.mockResolvedValue(true);

      await esperarErrorCase(
        service.asignar(7, { habilidadId: 2 }),
        ErrorCase.ALREADY_EXISTS,
      );

      expect(hjRepo.existsBy).toHaveBeenCalledWith({
        jugador: { id: 7 },
        habilidad: { id: 2 },
      });
      expect(hjRepo.save).not.toHaveBeenCalled();
    });

    it('caso feliz: guarda la relación y devuelve HabilidadResumen (ACUERDOS 9.12)', async () => {
      const respuesta = await service.asignar(7, { habilidadId: 2 });

      expect(hjRepo.create).toHaveBeenCalledWith({
        jugador: jugador(),
        habilidad: habilidad(),
      });
      expect(hjRepo.save).toHaveBeenCalledTimes(1);
      expect(respuesta).not.toBeInstanceOf(Habilidad);
      expect(respuesta).not.toBeInstanceOf(HabilidadJugador);
      expect(respuesta).toEqual({
        id: 2,
        nombre: 'Regate',
        categoria: CategoriaHabilidad.TECNICA,
      });
      // Nunca escribe en entidades ajenas (B).
      expect(jugadorRepo.save).not.toHaveBeenCalled();
      expect(habilidadRepo.save).not.toHaveBeenCalled();
    });

    it('permite asignar una segunda habilidad distinta al mismo jugador', async () => {
      const otraHabilidad = habilidad({
        id: 3,
        nombre: 'Velocidad',
        categoria: CategoriaHabilidad.FISICA,
      });
      habilidadRepo.findOneBy.mockResolvedValue(otraHabilidad);

      const respuesta = await service.asignar(7, { habilidadId: 3 });

      expect(respuesta).toEqual({
        id: 3,
        nombre: 'Velocidad',
        categoria: CategoriaHabilidad.FISICA,
      });
    });

    it('permite asignar la misma habilidad a un jugador distinto', async () => {
      const otroJugador = jugador({
        id: 8,
        nombres: 'Carlos',
        apellidos: 'Gómez',
      });
      jugadorRepo.findOneBy.mockResolvedValue(otroJugador);

      const respuesta = await service.asignar(8, { habilidadId: 2 });

      expect(hjRepo.existsBy).toHaveBeenCalledWith({
        jugador: { id: 8 },
        habilidad: { id: 2 },
      });
      expect(respuesta.id).toBe(2);
    });
  });

  describe('listarHabilidadesPorJugador', () => {
    it('lanza NOT_FOUND si el jugador no existe', async () => {
      jugadorRepo.findOneBy.mockResolvedValue(null);

      await esperarErrorCase(
        service.listarHabilidadesPorJugador(99),
        ErrorCase.NOT_FOUND,
      );

      expect(hjRepo.find).not.toHaveBeenCalled();
    });

    it('devuelve las habilidades del jugador ordenadas por nombre ascendente como HabilidadResumen[]', async () => {
      hjRepo.find.mockResolvedValue([
        asignacion({
          habilidad: habilidad({
            id: 2,
            nombre: 'Regate',
            categoria: CategoriaHabilidad.TECNICA,
          }),
        }),
        asignacion({
          id: 11,
          habilidad: habilidad({
            id: 3,
            nombre: 'Velocidad',
            categoria: CategoriaHabilidad.FISICA,
          }),
        }),
      ]);

      const resultado = await service.listarHabilidadesPorJugador(7);

      expect(hjRepo.find).toHaveBeenCalledWith({
        where: { jugador: { id: 7 } },
        relations: { habilidad: true },
        order: { habilidad: { nombre: 'ASC' } },
      });
      expect(resultado).toEqual([
        { id: 2, nombre: 'Regate', categoria: CategoriaHabilidad.TECNICA },
        { id: 3, nombre: 'Velocidad', categoria: CategoriaHabilidad.FISICA },
      ]);
    });

    it('devuelve arreglo vacío si el jugador no tiene habilidades asignadas', async () => {
      await expect(service.listarHabilidadesPorJugador(7)).resolves.toEqual([]);
    });
  });

  describe('listarJugadoresPorHabilidad', () => {
    it('lanza NOT_FOUND si la habilidad no existe', async () => {
      habilidadRepo.findOneBy.mockResolvedValue(null);

      await esperarErrorCase(
        service.listarJugadoresPorHabilidad(99),
        ErrorCase.NOT_FOUND,
      );

      expect(hjRepo.find).not.toHaveBeenCalled();
    });

    it('devuelve los jugadores con la habilidad ordenados por apellidos y nombres ascendente como JugadorResumen[]', async () => {
      hjRepo.find.mockResolvedValue([
        asignacion({
          jugador: jugador({
            id: 8,
            numeroDocumento: '1053000001',
            nombres: 'Carlos',
            apellidos: 'Gómez',
          }),
        }),
        asignacion({
          id: 11,
          jugador: jugador({
            id: 7,
            numeroDocumento: '1053000000',
            nombres: 'Juan',
            apellidos: 'Pérez',
          }),
        }),
      ]);

      const resultado = await service.listarJugadoresPorHabilidad(2);

      expect(hjRepo.find).toHaveBeenCalledWith({
        where: { habilidad: { id: 2 } },
        relations: { jugador: true },
        order: { jugador: { apellidos: 'ASC', nombres: 'ASC' } },
      });
      expect(resultado).toEqual([
        {
          id: 8,
          tipoDocumento: TipoDocumento.CC,
          numeroDocumento: '1053000001',
          nombreCompleto: 'Carlos Gómez',
          activo: true,
        },
        {
          id: 7,
          tipoDocumento: TipoDocumento.CC,
          numeroDocumento: '1053000000',
          nombreCompleto: 'Juan Pérez',
          activo: true,
        },
      ]);
    });

    it('devuelve arreglo vacío si ningún jugador tiene esa habilidad', async () => {
      await expect(service.listarJugadoresPorHabilidad(2)).resolves.toEqual([]);
    });
  });

  describe('retirar', () => {
    it('lanza NOT_FOUND si el jugador no existe', async () => {
      jugadorRepo.findOneBy.mockResolvedValue(null);

      await esperarErrorCase(service.retirar(99, 2), ErrorCase.NOT_FOUND);

      expect(hjRepo.remove).not.toHaveBeenCalled();
    });

    it('lanza NOT_FOUND si la habilidad no existe', async () => {
      habilidadRepo.findOneBy.mockResolvedValue(null);

      await esperarErrorCase(service.retirar(7, 99), ErrorCase.NOT_FOUND);

      expect(hjRepo.remove).not.toHaveBeenCalled();
    });

    it('lanza NOT_FOUND si el jugador no tiene asignada esa habilidad', async () => {
      hjRepo.findOneBy.mockResolvedValue(null);

      await esperarErrorCase(service.retirar(7, 2), ErrorCase.NOT_FOUND);

      expect(hjRepo.findOneBy).toHaveBeenCalledWith({
        jugador: { id: 7 },
        habilidad: { id: 2 },
      });
      expect(hjRepo.remove).not.toHaveBeenCalled();
    });

    it('elimina solo la fila de habilidad_jugador y conserva intactos al jugador y a la habilidad', async () => {
      const fila = asignacion();
      hjRepo.findOneBy.mockResolvedValue(fila);

      await expect(service.retirar(7, 2)).resolves.toBeUndefined();

      expect(hjRepo.remove).toHaveBeenCalledTimes(1);
      expect(hjRepo.remove).toHaveBeenCalledWith(fila);
      expect(habilidadRepo.remove).not.toHaveBeenCalled();
      expect(habilidadRepo.delete).not.toHaveBeenCalled();
      expect(jugadorRepo.remove).not.toHaveBeenCalled();
      expect(jugadorRepo.delete).not.toHaveBeenCalled();
    });
  });
});
