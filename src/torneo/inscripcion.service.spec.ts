import { ErrorCase } from '../common/errores/error-case.enum';
import { Deporte } from '../deporte/entities/deporte.entity';
import { EquipoDeporte } from '../equipo/entities/equipo-deporte.entity';
import { Equipo } from '../equipo/entities/equipo.entity';
import { EstadoTorneo } from './entities/estado-torneo.enum';
import { Inscripcion } from './entities/inscripcion.entity';
import { Torneo } from './entities/torneo.entity';
import { InscripcionService } from './inscripcion.service';

describe('InscripcionService (HU-GC-02)', () => {
  let service: InscripcionService;
  const torneos = { findOne: jest.fn() };
  const equipos = { existsBy: jest.fn() };
  const inscripciones = {
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };
  const grupoEquipos = { existsBy: jest.fn() };
  const partidos = { exists: jest.fn() };

  const txEquipoRepo = { findOneBy: jest.fn() };
  const txAsociacionRepo = { existsBy: jest.fn() };
  const txInscripcionRepo = {
    existsBy: jest.fn(),
    countBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const dataSource = {
    transaction: jest.fn(),
  };

  const torneoAbierto = (extra: Partial<Torneo> = {}): Torneo =>
    ({
      id: 1,
      nombre: 'Copa Caldas 2026',
      deporte: { id: 1, nombre: 'Fútbol', activo: true } as Deporte,
      fechaInicio: '2099-12-01',
      fechaFin: '2099-12-20',
      fechaCierreInscripciones: '2099-11-28',
      maxEquipos: 2,
      estado: EstadoTorneo.INSCRIPCIONES_ABIERTAS,
      ...extra,
    }) as Torneo;

  beforeEach(() => {
    jest.resetAllMocks();
    dataSource.transaction.mockImplementation(
      async (cb: (manager: unknown) => Promise<void>) => {
        const manager = {
          getRepository: (entity: unknown) => {
            if (entity === Equipo) return txEquipoRepo;
            if (entity === EquipoDeporte) return txAsociacionRepo;
            if (entity === Inscripcion) return txInscripcionRepo;
            throw new Error('Repositorio inesperado');
          },
        };
        await cb(manager);
      },
    );
    txInscripcionRepo.create.mockImplementation((d: Partial<Inscripcion>) => ({
      id: 30,
      fechaInscripcion: new Date(2026, 10, 20, 10, 0, 0),
      ...d,
    }));
    txInscripcionRepo.save.mockResolvedValue({});
    grupoEquipos.existsBy.mockResolvedValue(false);
    partidos.exists.mockResolvedValue(false);

    service = new InscripcionService(
      torneos as never,
      equipos as never,
      inscripciones as never,
      grupoEquipos as never,
      partidos as never,
      dataSource as never,
    );
  });

  it('inscribe múltiples equipos dentro de una transacción', async () => {
    torneos.findOne.mockResolvedValue(torneoAbierto());
    txEquipoRepo.findOneBy
      .mockResolvedValueOnce({ id: 4, nombre: 'Once Caldas', activo: true })
      .mockResolvedValueOnce({ id: 9, nombre: 'Pereira', activo: true });
    txAsociacionRepo.existsBy.mockResolvedValue(true);
    txInscripcionRepo.existsBy.mockResolvedValue(false);
    txInscripcionRepo.countBy
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);

    const res = await service.inscribir(1, { equipoIds: [4, 9] });

    expect(res).toHaveLength(2);
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(txInscripcionRepo.save).toHaveBeenCalledTimes(2);
  });

  it('incluye el nombre del equipo cuando se supera maxEquipos', async () => {
    torneos.findOne.mockResolvedValue(torneoAbierto({ maxEquipos: 2 }));
    txEquipoRepo.findOneBy.mockResolvedValue({
      id: 11,
      nombre: 'América',
      activo: true,
    });
    txAsociacionRepo.existsBy.mockResolvedValue(true);
    txInscripcionRepo.existsBy.mockResolvedValue(false);
    txInscripcionRepo.countBy.mockResolvedValue(2);

    await expect(service.inscribir(1, { equipoIds: [11] })).rejects.toMatchObject({
      errorCase: ErrorCase.INVALID_OPERATION,
      message: expect.stringContaining('América'),
    });
  });

  it('impide retirar inscripción si el equipo está en un grupo del torneo', async () => {
    torneos.findOne.mockResolvedValue(torneoAbierto());
    inscripciones.findOne.mockResolvedValue({
      id: 30,
      torneo: torneoAbierto(),
      equipo: { id: 4, nombre: 'Once Caldas', activo: true },
    });
    grupoEquipos.existsBy.mockResolvedValue(true);

    await expect(service.retirar(1, 4)).rejects.toMatchObject({
      errorCase: ErrorCase.INVALID_OPERATION,
      message: expect.stringContaining('grupo'),
    });
    expect(inscripciones.remove).not.toHaveBeenCalled();
  });

  it('impide retirar inscripción si el equipo tiene partidos en el torneo', async () => {
    torneos.findOne.mockResolvedValue(torneoAbierto());
    inscripciones.findOne.mockResolvedValue({
      id: 30,
      torneo: torneoAbierto(),
      equipo: { id: 4, nombre: 'Once Caldas', activo: true },
    });
    grupoEquipos.existsBy.mockResolvedValue(false);
    partidos.exists.mockResolvedValue(true);

    await expect(service.retirar(1, 4)).rejects.toMatchObject({
      errorCase: ErrorCase.INVALID_OPERATION,
      message: expect.stringContaining('partidos'),
    });
    expect(inscripciones.remove).not.toHaveBeenCalled();
  });

  it('retira la inscripción cuando está abierta y sin grupos ni partidos', async () => {
    const fila = {
      id: 30,
      torneo: torneoAbierto(),
      equipo: { id: 4, nombre: 'Once Caldas', activo: true },
    };
    torneos.findOne.mockResolvedValue(torneoAbierto());
    inscripciones.findOne.mockResolvedValue(fila);

    await service.retirar(1, 4);
    expect(inscripciones.remove).toHaveBeenCalledWith(fila);
  });
});
