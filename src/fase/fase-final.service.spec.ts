import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
import type { Equipo } from '../equipo/entities/equipo.entity';
import { EstadoPartido } from '../partido/entities/estado-partido.enum';
import { Partido } from '../partido/entities/partido.entity';
import { EstadoTorneo } from '../torneo/entities/estado-torneo.enum';
import { Torneo } from '../torneo/entities/torneo.entity';
import { Fase, FaseFinal, Grupo } from './entities/fase.entity';
import { RondaFinal } from './entities/ronda-final.enum';
import { TipoFase } from './entities/tipo-fase.enum';
import { FaseFinalService } from './fase-final.service';

const crearTorneo = (extra: Partial<Torneo> = {}): Torneo =>
  ({
    id: 1,
    nombre: 'Copa Caldas 2026',
    estado: EstadoTorneo.EN_CURSO,
    ...extra,
  }) as Torneo;

const crearFaseFinal = (
  extra: Partial<
    Pick<
      FaseFinal,
      'id' | 'nombre' | 'orden' | 'cantidadEquipos' | 'tercerPuesto' | 'torneo'
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

describe('FaseFinalService (HU-GC-05)', () => {
  let service: FaseFinalService;
  let faseFinalRepository: Record<string, jest.Mock>;
  let faseRepository: Record<string, jest.Mock>;
  let grupoRepository: Record<string, jest.Mock>;
  let torneoRepository: Record<string, jest.Mock>;
  let partidoRepository: Record<string, jest.Mock>;

  beforeEach(async () => {
    faseFinalRepository = {
      existsBy: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    faseRepository = {
      existsBy: jest.fn(),
    };
    grupoRepository = {
      existsBy: jest.fn(),
    };
    torneoRepository = {
      findOneBy: jest.fn(),
    };
    partidoRepository = {
      existsBy: jest.fn(),
      countBy: jest.fn(),
      find: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        FaseFinalService,
        {
          provide: getRepositoryToken(FaseFinal),
          useValue: faseFinalRepository,
        },
        { provide: getRepositoryToken(Fase), useValue: faseRepository },
        { provide: getRepositoryToken(Grupo), useValue: grupoRepository },
        { provide: getRepositoryToken(Torneo), useValue: torneoRepository },
        { provide: getRepositoryToken(Partido), useValue: partidoRepository },
      ],
    }).compile();

    service = moduleRef.get(FaseFinalService);
  });

  describe('crear (POST /api/torneos/:torneoId/fase-final)', () => {
    it('crea la fase final con tercerPuesto=false por defecto y devuelve FaseResponseDto', async () => {
      const torneo = crearTorneo();
      torneoRepository.findOneBy.mockResolvedValue(torneo);
      faseFinalRepository.existsBy.mockResolvedValue(false);
      faseRepository.existsBy.mockResolvedValue(false);
      grupoRepository.existsBy.mockResolvedValue(false);
      faseFinalRepository.create.mockImplementation(
        (datos: Partial<FaseFinal>) => Object.assign(new FaseFinal(), datos),
      );
      faseFinalRepository.save.mockImplementation((entidad: FaseFinal) => {
        entidad.id = 8;
        return Promise.resolve(entidad);
      });

      const resultado = await service.crear(1, {
        nombre: '  Fase final  ',
        orden: 2,
        cantidadEquipos: 8,
      });

      expect(resultado).toEqual({
        id: 8,
        torneo: { id: 1, nombre: 'Copa Caldas 2026', estado: 'EN_CURSO' },
        nombre: 'Fase final',
        tipo: TipoFase.FINAL,
        orden: 2,
        cantidadEquipos: 8,
        tercerPuesto: false,
        cantidadPartidos: 0,
      });
    });

    it('lanza NOT_FOUND si el torneo no existe', async () => {
      torneoRepository.findOneBy.mockResolvedValue(null);

      await esperarErrorCase(
        service.crear(99, {
          nombre: 'Fase final',
          orden: 2,
          cantidadEquipos: 4,
        }),
        ErrorCase.NOT_FOUND,
      );
    });

    it('lanza INVALID_OPERATION si el torneo está FINALIZADO o CANCELADO', async () => {
      torneoRepository.findOneBy.mockResolvedValue(
        crearTorneo({ estado: EstadoTorneo.FINALIZADO }),
      );

      await esperarErrorCase(
        service.crear(1, {
          nombre: 'Fase final',
          orden: 2,
          cantidadEquipos: 4,
        }),
        ErrorCase.INVALID_OPERATION,
      );
    });

    it('lanza INVALID_OPERATION si cantidadEquipos es inválida o si cantidadEquipos=2 con tercerPuesto=true', async () => {
      torneoRepository.findOneBy.mockResolvedValue(crearTorneo());

      await esperarErrorCase(
        service.crear(1, {
          nombre: 'Fase final',
          orden: 2,
          cantidadEquipos: 6,
        }),
        ErrorCase.INVALID_OPERATION,
      );

      await esperarErrorCase(
        service.crear(1, {
          nombre: 'Gran final',
          orden: 2,
          cantidadEquipos: 2,
          tercerPuesto: true,
        }),
        ErrorCase.INVALID_OPERATION,
      );
    });

    it('lanza ALREADY_EXISTS si el torneo ya tiene una fase final', async () => {
      torneoRepository.findOneBy.mockResolvedValue(crearTorneo());
      faseFinalRepository.existsBy.mockResolvedValue(true);

      await esperarErrorCase(
        service.crear(1, {
          nombre: 'Fase final',
          orden: 2,
          cantidadEquipos: 4,
        }),
        ErrorCase.ALREADY_EXISTS,
      );
    });

    it('lanza ALREADY_EXISTS si el nombre ya existe en otra fase del torneo', async () => {
      torneoRepository.findOneBy.mockResolvedValue(crearTorneo());
      faseFinalRepository.existsBy.mockResolvedValue(false);
      faseRepository.existsBy.mockResolvedValue(true);

      await esperarErrorCase(
        service.crear(1, {
          nombre: 'Grupo A',
          orden: 2,
          cantidadEquipos: 4,
        }),
        ErrorCase.ALREADY_EXISTS,
      );
    });

    it('lanza INVALID_OPERATION si el orden no es mayor que el de todos los grupos', async () => {
      torneoRepository.findOneBy.mockResolvedValue(crearTorneo());
      faseFinalRepository.existsBy.mockResolvedValue(false);
      faseRepository.existsBy.mockResolvedValue(false);
      grupoRepository.existsBy.mockResolvedValue(true);

      await esperarErrorCase(
        service.crear(1, {
          nombre: 'Fase final',
          orden: 1,
          cantidadEquipos: 4,
        }),
        ErrorCase.INVALID_OPERATION,
      );
    });
  });

  describe('obtenerPorTorneo (GET /api/torneos/:torneoId/fase-final)', () => {
    it('devuelve la fase final con su conteo de partidos', async () => {
      torneoRepository.findOneBy.mockResolvedValue(crearTorneo());
      faseFinalRepository.findOne.mockResolvedValue(crearFaseFinal());
      partidoRepository.countBy.mockResolvedValue(3);

      const resultado = await service.obtenerPorTorneo(1);

      expect(resultado).toEqual({
        id: 8,
        torneo: { id: 1, nombre: 'Copa Caldas 2026', estado: 'EN_CURSO' },
        nombre: 'Fase final',
        tipo: TipoFase.FINAL,
        orden: 2,
        cantidadEquipos: 4,
        tercerPuesto: true,
        cantidadPartidos: 3,
      });
    });

    it('lanza NOT_FOUND si el torneo no existe o no tiene fase final', async () => {
      torneoRepository.findOneBy.mockResolvedValue(null);
      await esperarErrorCase(service.obtenerPorTorneo(99), ErrorCase.NOT_FOUND);

      torneoRepository.findOneBy.mockResolvedValue(crearTorneo());
      faseFinalRepository.findOne.mockResolvedValue(null);
      await esperarErrorCase(service.obtenerPorTorneo(1), ErrorCase.NOT_FOUND);
    });
  });

  describe('actualizar (PUT /api/fases-finales/:id)', () => {
    it('actualiza la fase final correctamente cuando cumple las reglas', async () => {
      const faseFinal = crearFaseFinal({
        cantidadEquipos: 4,
        tercerPuesto: false,
      });
      faseFinalRepository.findOne.mockResolvedValue(faseFinal);
      partidoRepository.existsBy.mockResolvedValue(false);
      faseRepository.existsBy.mockResolvedValue(false);
      grupoRepository.existsBy.mockResolvedValue(false);
      faseFinalRepository.save.mockResolvedValue(faseFinal);
      partidoRepository.countBy.mockResolvedValue(0);

      const resultado = await service.actualizar(8, {
        nombre: '  Eliminatorias  ',
        orden: 3,
        cantidadEquipos: 8,
        tercerPuesto: true,
      });

      expect(resultado).toEqual({
        id: 8,
        torneo: { id: 1, nombre: 'Copa Caldas 2026', estado: 'EN_CURSO' },
        nombre: 'Eliminatorias',
        tipo: TipoFase.FINAL,
        orden: 3,
        cantidadEquipos: 8,
        tercerPuesto: true,
        cantidadPartidos: 0,
      });
    });

    it('lanza NOT_FOUND si la fase final no existe', async () => {
      faseFinalRepository.findOne.mockResolvedValue(null);

      await esperarErrorCase(
        service.actualizar(99, {
          nombre: 'Fase final',
          orden: 2,
          cantidadEquipos: 4,
        }),
        ErrorCase.NOT_FOUND,
      );
    });

    it('lanza INVALID_OPERATION si el torneo está CANCELADO', async () => {
      faseFinalRepository.findOne.mockResolvedValue(
        crearFaseFinal({
          torneo: crearTorneo({ estado: EstadoTorneo.CANCELADO }),
        }),
      );

      await esperarErrorCase(
        service.actualizar(8, {
          nombre: 'Fase final',
          orden: 2,
          cantidadEquipos: 4,
        }),
        ErrorCase.INVALID_OPERATION,
      );
    });

    it('lanza INVALID_OPERATION al cambiar cantidadEquipos si ya tiene partidos', async () => {
      faseFinalRepository.findOne.mockResolvedValue(
        crearFaseFinal({ cantidadEquipos: 4 }),
      );
      partidoRepository.existsBy.mockResolvedValue(true);

      await esperarErrorCase(
        service.actualizar(8, {
          nombre: 'Fase final',
          orden: 2,
          cantidadEquipos: 8,
          tercerPuesto: true,
        }),
        ErrorCase.INVALID_OPERATION,
      );
    });

    it('lanza INVALID_OPERATION al deshabilitar tercerPuesto si ya hay partidos en TERCER_PUESTO', async () => {
      faseFinalRepository.findOne.mockResolvedValue(
        crearFaseFinal({ cantidadEquipos: 4, tercerPuesto: true }),
      );
      partidoRepository.existsBy.mockResolvedValue(true);

      await esperarErrorCase(
        service.actualizar(8, {
          nombre: 'Fase final',
          orden: 2,
          cantidadEquipos: 4,
          tercerPuesto: false,
        }),
        ErrorCase.INVALID_OPERATION,
      );

      expect(partidoRepository.existsBy).toHaveBeenCalledWith({
        fase: { id: 8 },
        ronda: RondaFinal.TERCER_PUESTO,
      });
    });

    it('lanza INVALID_OPERATION si se intenta poner cantidadEquipos=2 y tercerPuesto=true', async () => {
      faseFinalRepository.findOne.mockResolvedValue(crearFaseFinal());

      await esperarErrorCase(
        service.actualizar(8, {
          nombre: 'Gran final',
          orden: 2,
          cantidadEquipos: 2,
          tercerPuesto: true,
        }),
        ErrorCase.INVALID_OPERATION,
      );
    });

    it('lanza ALREADY_EXISTS si el nombre colisiona con otra fase del torneo', async () => {
      faseFinalRepository.findOne.mockResolvedValue(crearFaseFinal());
      faseRepository.existsBy.mockResolvedValue(true);

      await esperarErrorCase(
        service.actualizar(8, {
          nombre: 'Grupo A',
          orden: 2,
          cantidadEquipos: 4,
          tercerPuesto: true,
        }),
        ErrorCase.ALREADY_EXISTS,
      );
    });

    it('lanza INVALID_OPERATION si el nuevo orden no es mayor que el de los grupos', async () => {
      faseFinalRepository.findOne.mockResolvedValue(
        crearFaseFinal({ orden: 3 }),
      );
      faseRepository.existsBy.mockResolvedValue(false);
      grupoRepository.existsBy.mockResolvedValue(true);

      await esperarErrorCase(
        service.actualizar(8, {
          nombre: 'Fase final',
          orden: 1,
          cantidadEquipos: 4,
          tercerPuesto: true,
        }),
        ErrorCase.INVALID_OPERATION,
      );
    });
  });

  describe('eliminar (DELETE /api/fases-finales/:id)', () => {
    it('elimina la fase final cuando no tiene partidos asociados', async () => {
      const faseFinal = crearFaseFinal();
      faseFinalRepository.findOne.mockResolvedValue(faseFinal);
      partidoRepository.countBy.mockResolvedValue(0);
      faseFinalRepository.remove.mockResolvedValue(faseFinal);

      await service.eliminar(8);

      expect(faseFinalRepository.remove).toHaveBeenCalledWith(faseFinal);
    });

    it('lanza NOT_FOUND si la fase final no existe', async () => {
      faseFinalRepository.findOne.mockResolvedValue(null);

      await esperarErrorCase(service.eliminar(99), ErrorCase.NOT_FOUND);
    });

    it('lanza INVALID_OPERATION si el torneo está FINALIZADO', async () => {
      faseFinalRepository.findOne.mockResolvedValue(
        crearFaseFinal({
          torneo: crearTorneo({ estado: EstadoTorneo.FINALIZADO }),
        }),
      );

      await esperarErrorCase(service.eliminar(8), ErrorCase.INVALID_OPERATION);
    });

    it('lanza HAS_ASSOCIATIONS si tiene partidos asociados', async () => {
      faseFinalRepository.findOne.mockResolvedValue(crearFaseFinal());
      partidoRepository.countBy.mockResolvedValue(2);

      await esperarErrorCase(service.eliminar(8), ErrorCase.HAS_ASSOCIATIONS);
      expect(faseFinalRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('obtenerLlaves (GET /api/fases-finales/:id/llaves)', () => {
    it('devuelve el cuadro completo de rondas, partidos activos y ganadores', async () => {
      faseFinalRepository.findOne.mockResolvedValue(
        crearFaseFinal({ cantidadEquipos: 4, tercerPuesto: true }),
      );
      partidoRepository.find.mockResolvedValue([
        {
          id: 20,
          equipoLocal: { id: 4, nombre: 'Once Caldas', activo: true } as Equipo,
          equipoVisitante: {
            id: 9,
            nombre: 'Deportes Pereira',
            activo: true,
          } as Equipo,
          fechaHora: new Date(2026, 11, 15, 19, 0, 0),
          estado: EstadoPartido.FINALIZADO,
          marcadorLocal: 2,
          marcadorVisitante: 1,
          ronda: RondaFinal.SEMIFINAL,
          numeroLlave: 1,
        } as Partido,
      ]);

      const llaves = await service.obtenerLlaves(8);

      expect(llaves.fase).toEqual({
        id: 8,
        nombre: 'Fase final',
        tipo: TipoFase.FINAL,
        orden: 2,
      });
      expect(llaves.cantidadEquipos).toBe(4);
      expect(llaves.tercerPuesto).toBe(true);
      expect(llaves.rondas.map((r) => r.ronda)).toEqual([
        RondaFinal.SEMIFINAL,
        RondaFinal.FINAL,
        RondaFinal.TERCER_PUESTO,
      ]);
      expect(llaves.rondas[0].llaves[0].ganador).toEqual({
        id: 4,
        nombre: 'Once Caldas',
        activo: true,
      });
      expect(llaves.rondas[0].llaves[1]).toEqual({
        numeroLlave: 2,
        partido: null,
        ganador: null,
      });
    });

    it('lanza NOT_FOUND si la fase final no existe', async () => {
      faseFinalRepository.findOne.mockResolvedValue(null);

      await esperarErrorCase(service.obtenerLlaves(99), ErrorCase.NOT_FOUND);
    });
  });
});
