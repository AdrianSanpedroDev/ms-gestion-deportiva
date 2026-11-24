import { ErrorCase } from '../common/errores/error-case.enum';
import { Deporte } from '../deporte/entities/deporte.entity';
import { EstadoTorneo } from '../torneo/entities/estado-torneo.enum';
import { Equipo } from './entities/equipo.entity';
import { EquipoDeporteService } from './equipo-deporte.service';

describe('EquipoDeporteService (HU-GD-03)', () => {
  let service: EquipoDeporteService;
  const equipoRepo = { findOneBy: jest.fn() };
  const deporteRepo = { findOneBy: jest.fn() };
  const asociaciones = {
    existsBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };
  const inscripciones = { find: jest.fn() };

  const equipo = (activo = true) =>
    ({ id: 4, nombre: 'Once Caldas', activo }) as Equipo;
  const deporte = (activo = true) =>
    ({ id: 1, nombre: 'Fútbol', activo }) as Deporte;

  beforeEach(() => {
    jest.resetAllMocks();
    asociaciones.create.mockImplementation((d: unknown) => d);
    asociaciones.save.mockResolvedValue({});
    service = new EquipoDeporteService(
      equipoRepo as never,
      deporteRepo as never,
      asociaciones as never,
      inscripciones as never,
    );
  });

  it('asocia equipo y deporte activos', async () => {
    equipoRepo.findOneBy.mockResolvedValue(equipo(true));
    deporteRepo.findOneBy.mockResolvedValue(deporte(true));
    asociaciones.existsBy.mockResolvedValue(false);

    const res = await service.asociar(4, 1);

    expect(res).toEqual({ id: 1, nombre: 'Fútbol', activo: true });
    expect(asociaciones.save).toHaveBeenCalledTimes(1);
  });

  it('rechaza asociar si el equipo o deporte está inactivo (400)', async () => {
    equipoRepo.findOneBy.mockResolvedValue(equipo(false));
    deporteRepo.findOneBy.mockResolvedValue(deporte(true));
    await expect(service.asociar(4, 1)).rejects.toMatchObject({
      errorCase: ErrorCase.INVALID_OPERATION,
    });
  });

  it('permite consultar deportes de un equipo INACTIVO sin dar 400', async () => {
    equipoRepo.findOneBy.mockResolvedValue(equipo(false));
    asociaciones.find.mockResolvedValue([{ deporte: deporte(true) }]);

    const res = await service.deportes(4);
    expect(res).toEqual([{ id: 1, nombre: 'Fútbol', activo: true }]);
  });

  it('permite consultar equipos de un deporte INACTIVO sin dar 400', async () => {
    deporteRepo.findOneBy.mockResolvedValue(deporte(false));
    asociaciones.find.mockResolvedValue([{ equipo: equipo(true) }]);

    const res = await service.equipos(1);
    expect(res).toEqual([{ id: 4, nombre: 'Once Caldas', activo: true }]);
  });

  it('impide retirar asociación si el equipo está en un torneo activo de ese deporte', async () => {
    asociaciones.findOne.mockResolvedValue({ id: 10 });
    inscripciones.find.mockResolvedValue([
      { torneo: { estado: EstadoTorneo.EN_CURSO } },
    ]);

    await expect(service.retirar(4, 1)).rejects.toMatchObject({
      errorCase: ErrorCase.INVALID_OPERATION,
    });
    expect(asociaciones.remove).not.toHaveBeenCalled();
  });

  it('permite retirar asociación si los torneos de ese deporte están FINALIZADO o CANCELADO', async () => {
    const fila = { id: 10 };
    asociaciones.findOne.mockResolvedValue(fila);
    inscripciones.find.mockResolvedValue([
      { torneo: { estado: EstadoTorneo.FINALIZADO } },
    ]);

    await service.retirar(4, 1);
    expect(asociaciones.remove).toHaveBeenCalledWith(fila);
  });
});
