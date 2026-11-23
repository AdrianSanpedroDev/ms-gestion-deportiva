import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
import { Equipo } from '../equipo/entities/equipo.entity';
import { EstadoPartido } from '../partido/entities/estado-partido.enum';
import { Partido } from '../partido/entities/partido.entity';
import { EstadoTorneo } from '../torneo/entities/estado-torneo.enum';
import { Inscripcion } from '../torneo/entities/inscripcion.entity';
import { Torneo } from '../torneo/entities/torneo.entity';
import { Fase, FaseFinal, Grupo } from './entities/fase.entity';
import { GrupoEquipo } from './entities/grupo-equipo.entity';
import { GrupoService } from './grupo.service';
import { FaseRepository } from './repositories/fase.repository';

const crearTorneo = (extra: Partial<Torneo> = {}): Torneo =>
  ({
    id: 1,
    nombre: 'Copa Caldas 2026',
    estado: EstadoTorneo.EN_CURSO,
    ...extra,
  }) as Torneo;

const crearGrupo = (
  extra: Partial<Pick<Grupo, 'id' | 'nombre' | 'orden' | 'torneo'>> = {},
): Grupo => {
  const grupo = new Grupo();
  grupo.id = extra.id ?? 3;
  grupo.torneo = extra.torneo ?? crearTorneo();
  grupo.nombre = extra.nombre ?? 'Grupo A';
  grupo.orden = extra.orden ?? 1;
  return grupo;
};

const crearFaseFinal = (orden = 2): FaseFinal => {
  const faseFinal = new FaseFinal();
  faseFinal.id = 8;
  faseFinal.torneo = crearTorneo();
  faseFinal.nombre = 'Fase final';
  faseFinal.orden = orden;
  faseFinal.cantidadEquipos = 4;
  faseFinal.tercerPuesto = true;
  return faseFinal;
};

const crearEquipo = (id: number, nombre: string, activo = true): Equipo =>
  ({ id, nombre, activo }) as Equipo;

async function esperarErrorCase(
  promesa: Promise<unknown>,
  errorCase: string,
): Promise<void> {
  await expect(promesa).rejects.toBeInstanceOf(ApplicationException);
  await expect(promesa).rejects.toMatchObject({ errorCase });
}

describe('GrupoService', () => {
  let service: GrupoService;

  const grupoRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };
  const faseRepo = {
    existsBy: jest.fn(),
  };
  const faseFinalRepo = {
    findOneBy: jest.fn(),
  };
  const grupoEquipoRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };
  const faseSqlRepo = {
    existeConflictoEquipoEnOrden: jest.fn(),
  };
  const torneoRepo = {
    findOneBy: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };
  const equipoRepo = {
    findOneBy: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };
  const inscripcionRepo = {
    existsBy: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };
  const partidoRepo = {
    countBy: jest.fn(),
    exists: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };

  const managerMock = {
    getRepository: jest.fn((entidad: unknown) => {
      if (entidad === Grupo) return grupoRepo;
      if (entidad === Equipo) return equipoRepo;
      if (entidad === Inscripcion) return inscripcionRepo;
      if (entidad === GrupoEquipo) return grupoEquipoRepo;
      throw new Error(`Entidad no esperada en transacción: ${String(entidad)}`);
    }),
  };

  const dataSourceMock = {
    transaction: jest.fn(
      async <T>(cb: (manager: typeof managerMock) => Promise<T>) =>
        cb(managerMock),
    ),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    managerMock.getRepository.mockImplementation((entidad: unknown) => {
      if (entidad === Grupo) return grupoRepo;
      if (entidad === Equipo) return equipoRepo;
      if (entidad === Inscripcion) return inscripcionRepo;
      if (entidad === GrupoEquipo) return grupoEquipoRepo;
      throw new Error(`Entidad no esperada en transacción: ${String(entidad)}`);
    });
    dataSourceMock.transaction.mockImplementation(
      async <T>(cb: (manager: typeof managerMock) => Promise<T>) =>
        cb(managerMock),
    );

    torneoRepo.findOneBy.mockResolvedValue(crearTorneo());
    faseRepo.existsBy.mockResolvedValue(false);
    faseFinalRepo.findOneBy.mockResolvedValue(null);
    faseSqlRepo.existeConflictoEquipoEnOrden.mockResolvedValue(false);
    grupoEquipoRepo.find.mockResolvedValue([]);
    partidoRepo.countBy.mockResolvedValue(0);
    partidoRepo.exists.mockResolvedValue(false);
    partidoRepo.find.mockResolvedValue([]);

    const modulo = await Test.createTestingModule({
      providers: [
        GrupoService,
        { provide: getRepositoryToken(Grupo), useValue: grupoRepo },
        { provide: getRepositoryToken(Fase), useValue: faseRepo },
        { provide: getRepositoryToken(FaseFinal), useValue: faseFinalRepo },
        { provide: getRepositoryToken(GrupoEquipo), useValue: grupoEquipoRepo },
        { provide: FaseRepository, useValue: faseSqlRepo },
        { provide: getDataSourceToken(), useValue: dataSourceMock },
        { provide: getRepositoryToken(Torneo), useValue: torneoRepo },
        { provide: getRepositoryToken(Equipo), useValue: equipoRepo },
        { provide: getRepositoryToken(Inscripcion), useValue: inscripcionRepo },
        { provide: getRepositoryToken(Partido), useValue: partidoRepo },
      ],
    }).compile();

    service = modulo.get(GrupoService);
  });

  describe('crear', () => {
    it('lanza NOT_FOUND si el torneo no existe', async () => {
      torneoRepo.findOneBy.mockResolvedValue(null);

      await esperarErrorCase(
        service.crear(999, { nombre: 'Grupo A', orden: 1 }),
        ErrorCase.NOT_FOUND,
      );
      expect(grupoRepo.save).not.toHaveBeenCalled();
    });

    it('lanza INVALID_OPERATION si el torneo está FINALIZADO o CANCELADO', async () => {
      torneoRepo.findOneBy.mockResolvedValue(
        crearTorneo({ estado: EstadoTorneo.FINALIZADO }),
      );

      await esperarErrorCase(
        service.crear(1, { nombre: 'Grupo A', orden: 1 }),
        ErrorCase.INVALID_OPERATION,
      );

      torneoRepo.findOneBy.mockResolvedValue(
        crearTorneo({ estado: EstadoTorneo.CANCELADO }),
      );

      await esperarErrorCase(
        service.crear(1, { nombre: 'Grupo A', orden: 1 }),
        ErrorCase.INVALID_OPERATION,
      );
      expect(grupoRepo.save).not.toHaveBeenCalled();
    });

    it('lanza ALREADY_EXISTS si ya existe una fase con el mismo nombre en el torneo', async () => {
      faseRepo.existsBy.mockResolvedValue(true);

      await esperarErrorCase(
        service.crear(1, { nombre: 'Grupo A', orden: 1 }),
        ErrorCase.ALREADY_EXISTS,
      );
      expect(grupoRepo.save).not.toHaveBeenCalled();
    });

    it('lanza INVALID_OPERATION si el orden es >= al orden de la FaseFinal', async () => {
      faseFinalRepo.findOneBy.mockResolvedValue(crearFaseFinal(2));

      await esperarErrorCase(
        service.crear(1, { nombre: 'Grupo A', orden: 2 }),
        ErrorCase.INVALID_OPERATION,
      );
      expect(grupoRepo.save).not.toHaveBeenCalled();
    });

    it('crea el grupo con nombre trimmeado y equipos vacíos', async () => {
      const torneo = crearTorneo();
      const entidad = crearGrupo({
        id: 3,
        nombre: 'Grupo A',
        orden: 1,
        torneo,
      });
      torneoRepo.findOneBy.mockResolvedValue(torneo);
      grupoRepo.create.mockReturnValue(entidad);
      grupoRepo.save.mockResolvedValue(entidad);

      const resultado = await service.crear(1, {
        nombre: '  Grupo A  ',
        orden: 1,
      });

      expect(grupoRepo.create).toHaveBeenCalledWith({
        torneo,
        nombre: 'Grupo A',
        orden: 1,
      });
      expect(resultado).toEqual({
        id: 3,
        torneo: { id: 1, nombre: 'Copa Caldas 2026', estado: 'EN_CURSO' },
        nombre: 'Grupo A',
        orden: 1,
        equipos: [],
      });
    });
  });

  describe('listarPorTorneo', () => {
    it('lanza NOT_FOUND si el torneo no existe', async () => {
      torneoRepo.findOneBy.mockResolvedValue(null);

      await esperarErrorCase(service.listarPorTorneo(999), ErrorCase.NOT_FOUND);
    });

    it('retorna arreglo vacío si el torneo no tiene grupos', async () => {
      grupoRepo.find.mockResolvedValue([]);

      const resultado = await service.listarPorTorneo(1);

      expect(resultado).toEqual([]);
      expect(grupoEquipoRepo.find).not.toHaveBeenCalled();
    });

    it('filtra opcionalmente por orden y carga equipos en lote', async () => {
      const grupoA = crearGrupo({ id: 3, nombre: 'Grupo A', orden: 1 });
      const once = crearEquipo(4, 'Once Caldas');
      const pereira = crearEquipo(9, 'Deportes Pereira');

      grupoRepo.find.mockResolvedValue([grupoA]);
      grupoEquipoRepo.find.mockResolvedValue([
        { grupo: grupoA, equipo: once },
        { grupo: grupoA, equipo: pereira },
      ]);

      const resultado = await service.listarPorTorneo(1, { orden: 1 });

      expect(grupoRepo.find).toHaveBeenCalledWith({
        where: { torneo: { id: 1 }, orden: 1 },
        relations: { torneo: true },
        order: { orden: 'ASC', nombre: 'ASC', id: 'ASC' },
      });
      expect(resultado).toEqual([
        {
          id: 3,
          torneo: { id: 1, nombre: 'Copa Caldas 2026', estado: 'EN_CURSO' },
          nombre: 'Grupo A',
          orden: 1,
          equipos: [
            { id: 9, nombre: 'Deportes Pereira', activo: true },
            { id: 4, nombre: 'Once Caldas', activo: true },
          ],
        },
      ]);
    });
  });

  describe('obtener', () => {
    it('lanza NOT_FOUND si el grupo no existe', async () => {
      grupoRepo.findOne.mockResolvedValue(null);

      await esperarErrorCase(service.obtener(999), ErrorCase.NOT_FOUND);
    });

    it('devuelve el grupo con sus equipos ordenados', async () => {
      const grupo = crearGrupo();
      grupoRepo.findOne.mockResolvedValue(grupo);
      grupoEquipoRepo.find.mockResolvedValue([
        { grupo, equipo: crearEquipo(4, 'Once Caldas') },
      ]);

      const resultado = await service.obtener(3);

      expect(resultado.id).toBe(3);
      expect(resultado.equipos).toEqual([
        { id: 4, nombre: 'Once Caldas', activo: true },
      ]);
    });
  });

  describe('actualizar', () => {
    it('lanza NOT_FOUND si el grupo no existe', async () => {
      grupoRepo.findOne.mockResolvedValue(null);

      await esperarErrorCase(
        service.actualizar(999, { nombre: 'Grupo B', orden: 1 }),
        ErrorCase.NOT_FOUND,
      );
    });

    it('lanza INVALID_OPERATION si el torneo está FINALIZADO', async () => {
      grupoRepo.findOne.mockResolvedValue(
        crearGrupo({
          torneo: crearTorneo({ estado: EstadoTorneo.FINALIZADO }),
        }),
      );

      await esperarErrorCase(
        service.actualizar(3, { nombre: 'Grupo B', orden: 1 }),
        ErrorCase.INVALID_OPERATION,
      );
    });

    it('lanza ALREADY_EXISTS si el nombre está duplicado en otra fase del torneo', async () => {
      grupoRepo.findOne.mockResolvedValue(crearGrupo());
      faseRepo.existsBy.mockResolvedValue(true);

      await esperarErrorCase(
        service.actualizar(3, { nombre: 'Grupo B', orden: 1 }),
        ErrorCase.ALREADY_EXISTS,
      );
    });

    it('lanza INVALID_OPERATION si el nuevo orden es >= al de la FaseFinal', async () => {
      grupoRepo.findOne.mockResolvedValue(crearGrupo({ orden: 1 }));
      faseFinalRepo.findOneBy.mockResolvedValue(crearFaseFinal(2));

      await esperarErrorCase(
        service.actualizar(3, { nombre: 'Grupo A', orden: 2 }),
        ErrorCase.INVALID_OPERATION,
      );
    });

    it('lanza ALREADY_EXISTS si al cambiar orden hay conflicto de equipos en otro grupo', async () => {
      grupoRepo.findOne.mockResolvedValue(crearGrupo({ orden: 1 }));
      faseSqlRepo.existeConflictoEquipoEnOrden.mockResolvedValue(true);

      await esperarErrorCase(
        service.actualizar(3, { nombre: 'Grupo A', orden: 2 }),
        ErrorCase.ALREADY_EXISTS,
      );
    });

    it('actualiza nombre y orden correctamente', async () => {
      const grupo = crearGrupo({ id: 3, nombre: 'Grupo A', orden: 1 });
      grupoRepo.findOne.mockResolvedValue(grupo);
      grupoEquipoRepo.find.mockResolvedValue([
        { grupo, equipo: crearEquipo(4, 'Once Caldas') },
      ]);

      const resultado = await service.actualizar(3, {
        nombre: '  Grupo Norte  ',
        orden: 2,
      });

      expect(grupoRepo.save).toHaveBeenCalledWith(grupo);
      expect(resultado.nombre).toBe('Grupo Norte');
      expect(resultado.orden).toBe(2);
      expect(resultado.equipos).toHaveLength(1);
    });
  });

  describe('eliminar', () => {
    it('lanza HAS_ASSOCIATIONS si el grupo tiene partidos asociados', async () => {
      grupoRepo.findOne.mockResolvedValue(crearGrupo());
      partidoRepo.countBy.mockResolvedValue(2);

      await esperarErrorCase(service.eliminar(3), ErrorCase.HAS_ASSOCIATIONS);
      expect(grupoRepo.remove).not.toHaveBeenCalled();
    });

    it('elimina el grupo sin tocar entidades ajenas (Torneo, Equipo, Partido)', async () => {
      const grupo = crearGrupo();
      grupoRepo.findOne.mockResolvedValue(grupo);

      await service.eliminar(3);

      expect(grupoRepo.remove).toHaveBeenCalledWith(grupo);
      expect(torneoRepo.remove).not.toHaveBeenCalled();
      expect(equipoRepo.remove).not.toHaveBeenCalled();
      expect(partidoRepo.remove).not.toHaveBeenCalled();
    });
  });

  describe('asignarEquipos (todo o nada)', () => {
    it('lanza NOT_FOUND si el grupo no existe', async () => {
      grupoRepo.findOne.mockResolvedValue(null);

      await esperarErrorCase(
        service.asignarEquipos(999, { equipoIds: [4] }),
        ErrorCase.NOT_FOUND,
      );
      expect(grupoEquipoRepo.save).not.toHaveBeenCalled();
    });

    it('lanza INVALID_OPERATION si un equipo está inactivo o no está inscrito (no guarda ninguno)', async () => {
      const grupo = crearGrupo();
      const activo = crearEquipo(4, 'Once Caldas', true);
      const inactivo = crearEquipo(9, 'Equipo Inactivo', false);

      grupoRepo.findOne.mockResolvedValue(grupo);
      equipoRepo.findOneBy
        .mockResolvedValueOnce(activo)
        .mockResolvedValueOnce(inactivo);
      inscripcionRepo.existsBy.mockResolvedValue(true);

      await esperarErrorCase(
        service.asignarEquipos(3, { equipoIds: [4, 9] }),
        ErrorCase.INVALID_OPERATION,
      );
      expect(grupoEquipoRepo.save).not.toHaveBeenCalled();

      // Caso no inscrito
      equipoRepo.findOneBy.mockReset();
      equipoRepo.findOneBy.mockResolvedValue(activo);
      inscripcionRepo.existsBy.mockResolvedValue(false);

      await esperarErrorCase(
        service.asignarEquipos(3, { equipoIds: [4] }),
        ErrorCase.INVALID_OPERATION,
      );
      expect(grupoEquipoRepo.save).not.toHaveBeenCalled();
    });

    it('lanza ALREADY_EXISTS si el equipo ya está en este grupo o en otro grupo del mismo orden', async () => {
      const grupoA = crearGrupo({ id: 3, nombre: 'Grupo A', orden: 1 });
      const grupoB = crearGrupo({ id: 4, nombre: 'Grupo B', orden: 1 });
      const once = crearEquipo(4, 'Once Caldas', true);

      grupoRepo.findOne.mockResolvedValue(grupoA);
      equipoRepo.findOneBy.mockResolvedValue(once);
      inscripcionRepo.existsBy.mockResolvedValue(true);

      // Ya en el mismo grupo
      grupoEquipoRepo.find.mockResolvedValue([{ grupo: grupoA, equipo: once }]);
      await esperarErrorCase(
        service.asignarEquipos(3, { equipoIds: [4] }),
        ErrorCase.ALREADY_EXISTS,
      );

      // Ya en otro grupo del mismo torneo y orden
      grupoEquipoRepo.find.mockResolvedValue([{ grupo: grupoB, equipo: once }]);
      await esperarErrorCase(
        service.asignarEquipos(3, { equipoIds: [4] }),
        ErrorCase.ALREADY_EXISTS,
      );
      expect(grupoEquipoRepo.save).not.toHaveBeenCalled();
    });

    it('asigna varios equipos en transacción y devuelve solo los recién asignados ordenados', async () => {
      const grupo = crearGrupo();
      const once = crearEquipo(4, 'Once Caldas', true);
      const pereira = crearEquipo(9, 'Deportes Pereira', true);

      grupoRepo.findOne.mockResolvedValue(grupo);
      grupoEquipoRepo.find.mockResolvedValue([]);
      equipoRepo.findOneBy
        .mockResolvedValueOnce(once)
        .mockResolvedValueOnce(pereira);
      inscripcionRepo.existsBy.mockResolvedValue(true);
      grupoEquipoRepo.create.mockImplementation((data: unknown) => data);
      grupoEquipoRepo.save.mockResolvedValue([]);

      const resultado = await service.asignarEquipos(3, { equipoIds: [4, 9] });

      expect(dataSourceMock.transaction).toHaveBeenCalledTimes(1);
      expect(grupoEquipoRepo.save).toHaveBeenCalledWith([
        { grupo, equipo: once },
        { grupo, equipo: pereira },
      ]);
      expect(resultado).toEqual([
        { id: 9, nombre: 'Deportes Pereira', activo: true },
        { id: 4, nombre: 'Once Caldas', activo: true },
      ]);
      expect(equipoRepo.save).not.toHaveBeenCalled();
      expect(inscripcionRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('listarEquipos', () => {
    it('retorna los equipos asignados al grupo ordenados por nombre', async () => {
      const grupo = crearGrupo();
      grupoRepo.findOne.mockResolvedValue(grupo);
      grupoEquipoRepo.find.mockResolvedValue([
        { grupo, equipo: crearEquipo(4, 'Once Caldas') },
        { grupo, equipo: crearEquipo(9, 'Deportes Pereira') },
      ]);

      const resultado = await service.listarEquipos(3);

      expect(resultado).toEqual([
        { id: 9, nombre: 'Deportes Pereira', activo: true },
        { id: 4, nombre: 'Once Caldas', activo: true },
      ]);
    });
  });

  describe('retirarEquipo', () => {
    it('lanza NOT_FOUND si el equipo no está asignado al grupo', async () => {
      grupoRepo.findOne.mockResolvedValue(crearGrupo());
      grupoEquipoRepo.findOne.mockResolvedValue(null);

      await esperarErrorCase(service.retirarEquipo(3, 4), ErrorCase.NOT_FOUND);
    });

    it('lanza INVALID_OPERATION (400) si el equipo tiene partidos en el grupo', async () => {
      grupoRepo.findOne.mockResolvedValue(crearGrupo());
      grupoEquipoRepo.findOne.mockResolvedValue({
        id: 10,
        equipo: crearEquipo(4, 'Once Caldas'),
      });
      partidoRepo.exists.mockResolvedValue(true);

      await esperarErrorCase(
        service.retirarEquipo(3, 4),
        ErrorCase.INVALID_OPERATION,
      );
      expect(grupoEquipoRepo.remove).not.toHaveBeenCalled();
    });

    it('retira el equipo del grupo sin eliminar el equipo ni el grupo', async () => {
      const asignacion = { id: 10, equipo: crearEquipo(4, 'Once Caldas') };
      grupoRepo.findOne.mockResolvedValue(crearGrupo());
      grupoEquipoRepo.findOne.mockResolvedValue(asignacion);
      partidoRepo.exists.mockResolvedValue(false);

      await service.retirarEquipo(3, 4);

      expect(grupoEquipoRepo.remove).toHaveBeenCalledWith(asignacion);
      expect(grupoRepo.remove).not.toHaveBeenCalled();
      expect(equipoRepo.remove).not.toHaveBeenCalled();
    });
  });

  describe('obtenerTablaPosiciones', () => {
    it('lanza NOT_FOUND si el grupo no existe', async () => {
      grupoRepo.findOne.mockResolvedValue(null);

      await esperarErrorCase(
        service.obtenerTablaPosiciones(999),
        ErrorCase.NOT_FOUND,
      );
    });

    it('calcula la tabla de posiciones con los partidos FINALIZADO del grupo', async () => {
      const grupo = crearGrupo();
      const once = crearEquipo(4, 'Once Caldas');
      const pereira = crearEquipo(9, 'Deportes Pereira');

      grupoRepo.findOne.mockResolvedValue(grupo);
      grupoEquipoRepo.find.mockResolvedValue([
        { grupo, equipo: once },
        { grupo, equipo: pereira },
      ]);
      partidoRepo.find.mockResolvedValue([
        {
          equipoLocal: once,
          equipoVisitante: pereira,
          marcadorLocal: 2,
          marcadorVisitante: 1,
          estado: EstadoPartido.FINALIZADO,
        },
      ]);

      const tabla = await service.obtenerTablaPosiciones(3);

      expect(partidoRepo.find).toHaveBeenCalledWith({
        where: { fase: { id: 3 }, estado: EstadoPartido.FINALIZADO },
        relations: { equipoLocal: true, equipoVisitante: true },
        order: { fechaHora: 'ASC' },
      });
      expect(tabla).toHaveLength(2);
      expect(tabla[0].equipo.id).toBe(4);
      expect(tabla[0].puntos).toBe(3);
      expect(tabla[1].equipo.id).toBe(9);
      expect(tabla[1].puntos).toBe(0);
    });
  });
});
