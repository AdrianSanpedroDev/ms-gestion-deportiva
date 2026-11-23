import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
import { Partido } from '../partido/entities/partido.entity';
import { EstadoTorneo } from '../torneo/entities/estado-torneo.enum';
import { Torneo } from '../torneo/entities/torneo.entity';
import { Fase, FaseFinal, Grupo } from './entities/fase.entity';
import { GrupoEquipo } from './entities/grupo-equipo.entity';
import { TipoFase } from './entities/tipo-fase.enum';
import { FaseService } from './fase.service';
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

const crearFaseFinal = (
  extra: Partial<
    Pick<
      FaseFinal,
      'id' | 'nombre' | 'orden' | 'torneo' | 'cantidadEquipos' | 'tercerPuesto'
    >
  > = {},
): FaseFinal => {
  const faseFinal = new FaseFinal();
  faseFinal.id = extra.id ?? 8;
  faseFinal.torneo = extra.torneo ?? crearTorneo();
  faseFinal.nombre = extra.nombre ?? 'Fase final';
  faseFinal.orden = extra.orden ?? 2;
  faseFinal.cantidadEquipos = extra.cantidadEquipos ?? 4;
  faseFinal.tercerPuesto = extra.tercerPuesto ?? true;
  return faseFinal;
};

async function esperarErrorCase(
  promesa: Promise<unknown>,
  errorCase: string,
): Promise<void> {
  await expect(promesa).rejects.toBeInstanceOf(ApplicationException);
  await expect(promesa).rejects.toMatchObject({ errorCase });
}

describe('FaseService', () => {
  let service: FaseService;

  const faseRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    existsBy: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const grupoRepo = {
    existsBy: jest.fn(),
  };
  const faseFinalRepo = {
    findOneBy: jest.fn(),
  };
  const grupoEquipoRepo = {
    countBy: jest.fn(),
  };
  const faseSqlRepo = {
    contarPartidosPorFase: jest.fn(),
    contarEquiposPorGrupo: jest.fn(),
    existeConflictoEquipoEnOrden: jest.fn(),
  };
  const torneoRepo = {
    findOneBy: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };
  const partidoRepo = {
    countBy: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    torneoRepo.findOneBy.mockResolvedValue(crearTorneo());
    faseRepo.existsBy.mockResolvedValue(false);
    grupoRepo.existsBy.mockResolvedValue(false);
    faseFinalRepo.findOneBy.mockResolvedValue(null);
    grupoEquipoRepo.countBy.mockResolvedValue(0);
    partidoRepo.countBy.mockResolvedValue(0);
    faseSqlRepo.contarPartidosPorFase.mockResolvedValue(new Map());
    faseSqlRepo.contarEquiposPorGrupo.mockResolvedValue(new Map());
    faseSqlRepo.existeConflictoEquipoEnOrden.mockResolvedValue(false);

    const modulo = await Test.createTestingModule({
      providers: [
        FaseService,
        { provide: getRepositoryToken(Fase), useValue: faseRepo },
        { provide: getRepositoryToken(Grupo), useValue: grupoRepo },
        { provide: getRepositoryToken(FaseFinal), useValue: faseFinalRepo },
        { provide: getRepositoryToken(GrupoEquipo), useValue: grupoEquipoRepo },
        { provide: FaseRepository, useValue: faseSqlRepo },
        { provide: getRepositoryToken(Torneo), useValue: torneoRepo },
        { provide: getRepositoryToken(Partido), useValue: partidoRepo },
      ],
    }).compile();

    service = modulo.get(FaseService);
  });

  describe('listarPorTorneo', () => {
    it('lanza NOT_FOUND si el torneo no existe', async () => {
      torneoRepo.findOneBy.mockResolvedValue(null);

      await esperarErrorCase(service.listarPorTorneo(999), ErrorCase.NOT_FOUND);
      expect(faseRepo.find).not.toHaveBeenCalled();
    });

    it('retorna arreglo vacío si el torneo no tiene fases', async () => {
      faseRepo.find.mockResolvedValue([]);

      const resultado = await service.listarPorTorneo(1);

      expect(resultado).toEqual([]);
      expect(faseSqlRepo.contarPartidosPorFase).not.toHaveBeenCalled();
      expect(faseSqlRepo.contarEquiposPorGrupo).not.toHaveBeenCalled();
    });

    it('lista fases ordenadas con conteos en lote de partidos y equipos por grupo', async () => {
      const grupoA = crearGrupo({ id: 3, nombre: 'Grupo A', orden: 1 });
      const faseFinal = crearFaseFinal({
        id: 8,
        nombre: 'Fase final',
        orden: 2,
      });
      faseRepo.find.mockResolvedValue([grupoA, faseFinal]);
      faseSqlRepo.contarPartidosPorFase.mockResolvedValue(
        new Map([
          [3, 6],
          [8, 2],
        ]),
      );
      faseSqlRepo.contarEquiposPorGrupo.mockResolvedValue(new Map([[3, 4]]));

      const resultado = await service.listarPorTorneo(1);

      expect(faseRepo.find).toHaveBeenCalledWith({
        where: { torneo: { id: 1 } },
        relations: { torneo: true },
        order: { orden: 'ASC', nombre: 'ASC', id: 'ASC' },
      });
      expect(faseSqlRepo.contarPartidosPorFase).toHaveBeenCalledWith([3, 8]);
      expect(faseSqlRepo.contarEquiposPorGrupo).toHaveBeenCalledWith([3]);
      expect(resultado).toEqual([
        {
          id: 3,
          torneo: { id: 1, nombre: 'Copa Caldas 2026', estado: 'EN_CURSO' },
          nombre: 'Grupo A',
          tipo: TipoFase.GRUPO,
          orden: 1,
          cantidadEquipos: 4,
          tercerPuesto: null,
          cantidadPartidos: 6,
        },
        {
          id: 8,
          torneo: { id: 1, nombre: 'Copa Caldas 2026', estado: 'EN_CURSO' },
          nombre: 'Fase final',
          tipo: TipoFase.FINAL,
          orden: 2,
          cantidadEquipos: 4,
          tercerPuesto: true,
          cantidadPartidos: 2,
        },
      ]);
    });
  });

  describe('obtener', () => {
    it('lanza NOT_FOUND si la fase no existe', async () => {
      faseRepo.findOne.mockResolvedValue(null);

      await esperarErrorCase(service.obtener(999), ErrorCase.NOT_FOUND);
    });

    it('devuelve FaseResponseDto para un Grupo con sus conteos', async () => {
      faseRepo.findOne.mockResolvedValue(crearGrupo());
      partidoRepo.countBy.mockResolvedValue(3);
      grupoEquipoRepo.countBy.mockResolvedValue(4);

      const resultado = await service.obtener(3);

      expect(resultado.tipo).toBe(TipoFase.GRUPO);
      expect(resultado.cantidadEquipos).toBe(4);
      expect(resultado.tercerPuesto).toBeNull();
      expect(resultado.cantidadPartidos).toBe(3);
    });

    it('devuelve FaseResponseDto para una FaseFinal sin consultar grupo_equipo', async () => {
      faseRepo.findOne.mockResolvedValue(crearFaseFinal());
      partidoRepo.countBy.mockResolvedValue(1);

      const resultado = await service.obtener(8);

      expect(resultado.tipo).toBe(TipoFase.FINAL);
      expect(resultado.cantidadEquipos).toBe(4);
      expect(resultado.tercerPuesto).toBe(true);
      expect(resultado.cantidadPartidos).toBe(1);
      expect(grupoEquipoRepo.countBy).not.toHaveBeenCalled();
    });
  });

  describe('actualizar', () => {
    it('lanza INVALID_OPERATION si no se envía ni nombre ni orden', async () => {
      await esperarErrorCase(
        service.actualizar(3, {}),
        ErrorCase.INVALID_OPERATION,
      );
      expect(faseRepo.findOne).not.toHaveBeenCalled();
    });

    it('lanza NOT_FOUND si la fase no existe', async () => {
      faseRepo.findOne.mockResolvedValue(null);

      await esperarErrorCase(
        service.actualizar(999, { nombre: 'Grupo X' }),
        ErrorCase.NOT_FOUND,
      );
    });

    it('lanza INVALID_OPERATION si el torneo está FINALIZADO o CANCELADO', async () => {
      faseRepo.findOne.mockResolvedValue(
        crearGrupo({
          torneo: crearTorneo({ estado: EstadoTorneo.FINALIZADO }),
        }),
      );

      await esperarErrorCase(
        service.actualizar(3, { nombre: 'Nuevo nombre' }),
        ErrorCase.INVALID_OPERATION,
      );

      faseRepo.findOne.mockResolvedValue(
        crearGrupo({
          torneo: crearTorneo({ estado: EstadoTorneo.CANCELADO }),
        }),
      );

      await esperarErrorCase(
        service.actualizar(3, { orden: 2 }),
        ErrorCase.INVALID_OPERATION,
      );
      expect(faseRepo.save).not.toHaveBeenCalled();
    });

    it('lanza ALREADY_EXISTS si ya existe otra fase con el mismo nombre en el torneo', async () => {
      faseRepo.findOne.mockResolvedValue(crearGrupo());
      faseRepo.existsBy.mockResolvedValue(true);

      await esperarErrorCase(
        service.actualizar(3, { nombre: 'Grupo B' }),
        ErrorCase.ALREADY_EXISTS,
      );
      expect(faseRepo.save).not.toHaveBeenCalled();
    });

    it('lanza INVALID_OPERATION si un Grupo intenta tomar orden >= orden de la FaseFinal', async () => {
      faseRepo.findOne.mockResolvedValue(crearGrupo({ orden: 1 }));
      faseFinalRepo.findOneBy.mockResolvedValue(crearFaseFinal({ orden: 2 }));

      await esperarErrorCase(
        service.actualizar(3, { orden: 2 }),
        ErrorCase.INVALID_OPERATION,
      );
      expect(faseRepo.save).not.toHaveBeenCalled();
    });

    it('lanza ALREADY_EXISTS si al cambiar orden de un Grupo hay equipos en otro grupo del mismo orden', async () => {
      faseRepo.findOne.mockResolvedValue(crearGrupo({ orden: 1 }));
      faseFinalRepo.findOneBy.mockResolvedValue(crearFaseFinal({ orden: 4 }));
      faseSqlRepo.existeConflictoEquipoEnOrden.mockResolvedValue(true);

      await esperarErrorCase(
        service.actualizar(3, { orden: 2 }),
        ErrorCase.ALREADY_EXISTS,
      );
      expect(faseRepo.save).not.toHaveBeenCalled();
    });

    it('lanza INVALID_OPERATION si una FaseFinal intenta tomar orden <= orden de algún Grupo', async () => {
      faseRepo.findOne.mockResolvedValue(crearFaseFinal({ orden: 3 }));
      grupoRepo.existsBy.mockResolvedValue(true);

      await esperarErrorCase(
        service.actualizar(8, { orden: 2 }),
        ErrorCase.INVALID_OPERATION,
      );
      expect(faseRepo.save).not.toHaveBeenCalled();
    });

    it('actualiza nombre y orden correctamente en caso feliz', async () => {
      const grupo = crearGrupo({ id: 3, nombre: 'Grupo A', orden: 1 });
      faseRepo.findOne.mockResolvedValue(grupo);
      faseFinalRepo.findOneBy.mockResolvedValue(crearFaseFinal({ orden: 3 }));
      partidoRepo.countBy.mockResolvedValue(2);
      grupoEquipoRepo.countBy.mockResolvedValue(4);

      const resultado = await service.actualizar(3, {
        nombre: '  Grupo Norte  ',
        orden: 2,
      });

      expect(faseRepo.save).toHaveBeenCalledWith(grupo);
      expect(grupo.nombre).toBe('Grupo Norte');
      expect(grupo.orden).toBe(2);
      expect(resultado.nombre).toBe('Grupo Norte');
      expect(resultado.orden).toBe(2);
      expect(resultado.cantidadEquipos).toBe(4);
      expect(resultado.cantidadPartidos).toBe(2);
    });
  });

  describe('eliminar', () => {
    it('lanza NOT_FOUND si la fase no existe', async () => {
      faseRepo.findOne.mockResolvedValue(null);

      await esperarErrorCase(service.eliminar(999), ErrorCase.NOT_FOUND);
    });

    it('lanza INVALID_OPERATION si el torneo está FINALIZADO o CANCELADO', async () => {
      faseRepo.findOne.mockResolvedValue(
        crearGrupo({
          torneo: crearTorneo({ estado: EstadoTorneo.FINALIZADO }),
        }),
      );

      await esperarErrorCase(service.eliminar(3), ErrorCase.INVALID_OPERATION);
      expect(partidoRepo.countBy).not.toHaveBeenCalled();
      expect(faseRepo.remove).not.toHaveBeenCalled();
    });

    it('lanza HAS_ASSOCIATIONS si la fase tiene partidos asociados', async () => {
      faseRepo.findOne.mockResolvedValue(crearGrupo());
      partidoRepo.countBy.mockResolvedValue(4);

      await esperarErrorCase(service.eliminar(3), ErrorCase.HAS_ASSOCIATIONS);
      expect(faseRepo.remove).not.toHaveBeenCalled();
    });

    it('elimina la fase sin tocar entidades ajenas (Torneo ni Partido)', async () => {
      const grupo = crearGrupo();
      faseRepo.findOne.mockResolvedValue(grupo);
      partidoRepo.countBy.mockResolvedValue(0);

      await service.eliminar(3);

      expect(faseRepo.remove).toHaveBeenCalledWith(grupo);
      expect(torneoRepo.save).not.toHaveBeenCalled();
      expect(torneoRepo.remove).not.toHaveBeenCalled();
      expect(torneoRepo.delete).not.toHaveBeenCalled();
      expect(partidoRepo.save).not.toHaveBeenCalled();
      expect(partidoRepo.remove).not.toHaveBeenCalled();
      expect(partidoRepo.delete).not.toHaveBeenCalled();
    });
  });
});
