import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
import { EstadoDto } from '../common/dto/estado.dto';
import { DeporteService } from './deporte.service';
import { CrearDeporteDto } from './dto/crear-deporte.dto';
import { Deporte } from './entities/deporte.entity';

const deporteEntidad = (extra: Partial<Deporte> = {}): Deporte =>
  ({
    id: 1,
    nombre: 'Futbol',
    descripcion: 'Deporte principal',
    activo: true,
    deportePadre: null,
    subdeportes: [],
    fechaCreacion: new Date('2026-11-20 10:00:00'),
    ...extra,
  }) as Deporte;

async function esperarErrorCase(
  promesa: Promise<unknown>,
  errorCase: ErrorCase,
): Promise<void> {
  await expect(promesa).rejects.toBeInstanceOf(ApplicationException);
  await expect(promesa).rejects.toMatchObject({ errorCase });
}

describe('DeporteService', () => {
  let service: DeporteService;
  const repo = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    existsBy: jest.fn(),
    countBy: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    merge: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const equipoDeporteRepo = { countBy: jest.fn() };
  const torneoRepo = { countBy: jest.fn() };

  beforeEach(() => {
    jest.resetAllMocks();
    repo.create.mockImplementation((datos: Partial<Deporte>) => ({
      id: 1,
      subdeportes: [],
      fechaCreacion: new Date('2026-11-20 10:00:00'),
      activo: true,
      ...datos,
    }));
    repo.save.mockImplementation((entidad: Deporte) =>
      Promise.resolve(entidad),
    );
    repo.merge.mockImplementation(
      (destino: Deporte, datos: Partial<Deporte>) =>
        Object.assign(destino, datos),
    );
    repo.remove.mockResolvedValue(undefined);
    repo.countBy.mockResolvedValue(0);
    equipoDeporteRepo.countBy.mockResolvedValue(0);
    torneoRepo.countBy.mockResolvedValue(0);

    service = new DeporteService(
      repo as never,
      repo as never,
      torneoRepo as never,
      equipoDeporteRepo as never,
    );
  });

  it('crea un deporte principal y devuelve el DTO', async () => {
    repo.existsBy.mockResolvedValue(false);
    const dto: CrearDeporteDto = {
      nombre: '  Futbol  ',
      descripcion: ' Deporte principal ',
    };

    const respuesta = await service.crear(dto);

    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(respuesta.nombre).toBe('Futbol');
    expect(respuesta.descripcion).toBe('Deporte principal');
    expect(respuesta.deportePadre).toBeNull();
  });

  it('rechaza nombres duplicados', async () => {
    repo.existsBy.mockResolvedValue(true);
    await esperarErrorCase(
      service.crear({ nombre: 'Futbol' }),
      ErrorCase.ALREADY_EXISTS,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('carga deportePadre al buscar el padre para validar dos niveles', async () => {
    repo.findOne.mockResolvedValue(deporteEntidad());

    await service.crear({ nombre: 'Sala', deportePadreId: 1 });

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: { deportePadre: true },
    });
  });

  it('rechaza que el padre sea inactivo', async () => {
    repo.findOne.mockResolvedValue(deporteEntidad({ activo: false }));
    await esperarErrorCase(
      service.crear({ nombre: 'Sala', deportePadreId: 1 }),
      ErrorCase.INVALID_OPERATION,
    );
  });

  it('rechaza que un padre tenga un padre (más de dos niveles)', async () => {
    repo.findOne.mockResolvedValue(
      deporteEntidad({ deportePadre: deporteEntidad({ id: 99 }) }),
    );
    await esperarErrorCase(
      service.crear({ nombre: 'Sala', deportePadreId: 1 }),
      ErrorCase.INVALID_OPERATION,
    );
  });

  it('actualiza el deporte sin permitir que sea su propio padre', async () => {
    repo.findOne.mockResolvedValue(deporteEntidad());
    await esperarErrorCase(
      service.actualizar(1, { nombre: 'Futbol sala', deportePadreId: 1 }),
      ErrorCase.INVALID_OPERATION,
    );
  });

  it('cambia el estado de un deporte', async () => {
    repo.findOne.mockResolvedValue(deporteEntidad());
    const dto: EstadoDto = { activo: false };

    const respuesta = await service.cambiarEstado(1, dto);

    expect(repo.save).toHaveBeenCalled();
    expect(respuesta.activo).toBe(false);
  });

  it('elimina un deporte sin asociaciones', async () => {
    repo.findOne.mockResolvedValue(deporteEntidad());
    await service.eliminar(1);
    expect(repo.remove).toHaveBeenCalledWith(deporteEntidad());
  });

  it('no elimina un deporte asociado', async () => {
    repo.findOne.mockResolvedValue(deporteEntidad());
    repo.countBy.mockResolvedValue(1);
    await esperarErrorCase(service.eliminar(1), ErrorCase.HAS_ASSOCIATIONS);
    expect(repo.remove).not.toHaveBeenCalled();
  });
});
