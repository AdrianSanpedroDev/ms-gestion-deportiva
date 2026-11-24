import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
import { Equipo } from './entities/equipo.entity';
import { EquipoService } from './equipo.service';

const equipoBase = (extra: Partial<Equipo> = {}): Equipo =>
  ({
    id: 4,
    nombre: 'Once Caldas',
    ciudad: 'Manizales',
    fechaFundacion: '1961-01-16',
    descripcion: 'Club profesional',
    activo: true,
    fechaCreacion: new Date(2026, 10, 20, 10, 0, 0),
    ...extra,
  }) as Equipo;

describe('EquipoService (HU-GD-02)', () => {
  let service: EquipoService;
  const equipos = {
    existsBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
  };
  const asociaciones = { countBy: jest.fn() };
  const contratos = { countBy: jest.fn() };
  const inscripciones = { countBy: jest.fn() };

  beforeEach(() => {
    jest.resetAllMocks();
    equipos.create.mockImplementation((d: Partial<Equipo>) => ({
      id: 4,
      activo: true,
      fechaCreacion: new Date(2026, 10, 20, 10, 0, 0),
      ...d,
    }));
    equipos.save.mockImplementation((e: Equipo) => Promise.resolve(e));
    equipos.merge.mockImplementation((d: Equipo, p: Partial<Equipo>) =>
      Object.assign(d, p),
    );
    asociaciones.countBy.mockResolvedValue(0);
    contratos.countBy.mockResolvedValue(0);
    inscripciones.countBy.mockResolvedValue(0);

    service = new EquipoService(
      equipos as never,
      asociaciones as never,
      contratos as never,
      inscripciones as never,
    );
  });

  it('crea un equipo válido con trim y devuelve DTO', async () => {
    equipos.existsBy.mockResolvedValue(false);
    const res = await service.crear({
      nombre: '  Once Caldas  ',
      ciudad: ' Manizales ',
      fechaFundacion: '1961-01-16',
    });

    expect(res.nombre).toBe('Once Caldas');
    expect(res.ciudad).toBe('Manizales');
    expect(equipos.save).toHaveBeenCalledTimes(1);
  });

  it('rechaza fechaFundacion futura con 400 INVALID_OPERATION', async () => {
    await expect(
      service.crear({
        nombre: 'Futuro FC',
        ciudad: 'Manizales',
        fechaFundacion: '2999-01-01',
      }),
    ).rejects.toMatchObject({ errorCase: ErrorCase.INVALID_OPERATION });
  });

  it('rechaza nombre duplicado con 409 ALREADY_EXISTS', async () => {
    equipos.existsBy.mockResolvedValue(true);
    await expect(
      service.crear({ nombre: 'Once Caldas', ciudad: 'Manizales' }),
    ).rejects.toMatchObject({ errorCase: ErrorCase.ALREADY_EXISTS });
  });

  it('cambia estado activo/inactivo', async () => {
    equipos.findOneBy.mockResolvedValue(equipoBase());
    const res = await service.cambiarEstado(4, { activo: false });
    expect(res.activo).toBe(false);
  });

  it('impide eliminar si tiene deportes, contratos o inscripciones detallando el motivo', async () => {
    equipos.findOneBy.mockResolvedValue(equipoBase());
    contratos.countBy.mockResolvedValue(3);
    inscripciones.countBy.mockResolvedValue(1);

    await expect(service.eliminar(4)).rejects.toBeInstanceOf(
      ApplicationException,
    );
    await expect(service.eliminar(4)).rejects.toMatchObject({
      errorCase: ErrorCase.HAS_ASSOCIATIONS,
      message: expect.stringContaining('3 contrato(s)'),
    });
    expect(equipos.remove).not.toHaveBeenCalled();
  });

  it('elimina un equipo sin asociaciones', async () => {
    const entidad = equipoBase();
    equipos.findOneBy.mockResolvedValue(entidad);
    await service.eliminar(4);
    expect(equipos.remove).toHaveBeenCalledWith(entidad);
  });
});
