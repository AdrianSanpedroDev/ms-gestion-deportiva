import { ErrorCase } from '../common/errores/error-case.enum';
import { Deporte } from '../deporte/entities/deporte.entity';
import { EstadoTorneo } from './entities/estado-torneo.enum';
import { Torneo } from './entities/torneo.entity';
import { TorneoService } from './torneo.service';

const torneoBase = (extra: Partial<Torneo> = {}): Torneo =>
  ({
    id: 1,
    nombre: 'Copa Caldas 2026',
    deporte: { id: 1, nombre: 'Fútbol', activo: true } as Deporte,
    descripcion: 'Torneo',
    fechaInicio: '2026-12-01',
    fechaFin: '2026-12-20',
    fechaCierreInscripciones: '2026-11-28',
    maxEquipos: 8,
    estado: EstadoTorneo.INSCRIPCIONES_ABIERTAS,
    fechaCreacion: new Date(2026, 10, 20, 10, 0, 0),
    ...extra,
  }) as Torneo;

describe('TorneoService (HU-GC-01)', () => {
  let service: TorneoService;
  const torneos = {
    existsBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
  };
  const deportes = { findOneBy: jest.fn() };
  const inscripciones = {
    countBy: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const fases = { countBy: jest.fn() };

  beforeEach(() => {
    jest.resetAllMocks();
    torneos.create.mockImplementation((d: Partial<Torneo>) => ({
      id: 1,
      fechaCreacion: new Date(2026, 10, 20, 10, 0, 0),
      ...d,
    }));
    torneos.save.mockImplementation((t: Torneo) => Promise.resolve(t));
    torneos.merge.mockImplementation((t: Torneo, d: Partial<Torneo>) =>
      Object.assign(t, d),
    );
    inscripciones.countBy.mockResolvedValue(0);
    fases.countBy.mockResolvedValue(0);

    service = new TorneoService(
      torneos as never,
      deportes as never,
      inscripciones as never,
      fases as never,
    );
  });

  it('valida fechas inválidas al crear', async () => {
    await expect(
      service.crear({
        nombre: 'Copa',
        deporteId: 1,
        fechaInicio: '2026-12-10',
        fechaFin: '2026-12-05',
        fechaCierreInscripciones: '2026-12-01',
      }),
    ).rejects.toMatchObject({ errorCase: ErrorCase.INVALID_OPERATION });
  });

  it('impide reducir maxEquipos por debajo de cantidadInscritos al actualizar', async () => {
    torneos.findOne.mockResolvedValue(torneoBase());
    torneos.existsBy.mockResolvedValue(false);
    inscripciones.countBy.mockResolvedValue(5);

    await expect(
      service.actualizar(1, {
        nombre: 'Copa Caldas 2026',
        deporteId: 1,
        fechaInicio: '2026-12-01',
        fechaFin: '2026-12-20',
        fechaCierreInscripciones: '2026-11-28',
        maxEquipos: 4,
      }),
    ).rejects.toMatchObject({ errorCase: ErrorCase.INVALID_OPERATION });
  });

  it('valida transiciones de estado', async () => {
    torneos.findOne.mockResolvedValue(
      torneoBase({ estado: EstadoTorneo.INSCRIPCIONES_ABIERTAS }),
    );
    await expect(
      service.cambiarEstado(1, { estado: EstadoTorneo.EN_CURSO }),
    ).rejects.toMatchObject({ errorCase: ErrorCase.INVALID_OPERATION });
  });

  it('impide eliminar un torneo que tiene fases aunque no tenga inscripciones (409 HAS_ASSOCIATIONS)', async () => {
    torneos.findOne.mockResolvedValue(torneoBase());
    inscripciones.countBy.mockResolvedValue(0);
    fases.countBy.mockResolvedValue(2);

    await expect(service.eliminar(1)).rejects.toMatchObject({
      errorCase: ErrorCase.HAS_ASSOCIATIONS,
      message: expect.stringContaining('2 fase(s)'),
    });
    expect(torneos.remove).not.toHaveBeenCalled();
  });

  it('elimina un torneo sin fases ni inscripciones', async () => {
    const entidad = torneoBase();
    torneos.findOne.mockResolvedValue(entidad);
    await service.eliminar(1);
    expect(torneos.remove).toHaveBeenCalledWith(entidad);
  });
});
