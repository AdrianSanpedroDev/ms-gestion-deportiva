import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
import type { Equipo } from '../equipo/entities/equipo.entity';
import { CategoriaHabilidad } from '../habilidad/entities/categoria-habilidad.enum';
import { Habilidad } from '../habilidad/entities/habilidad.entity';
import { HabilidadJugador } from '../habilidad-jugador/entities/habilidad-jugador.entity';
import { EquipoJugador } from '../jugador/entities/equipo-jugador.entity';
import { Jugador } from '../jugador/entities/jugador.entity';
import { TipoDocumento } from '../jugador/entities/tipo-documento.enum';
import { PerfilService } from './perfil.service';

// "Hoy" en Bogotá = 2026-11-22 (UTC-5).
const AHORA = new Date('2026-11-22T12:00:00-05:00');

const equipo = (extra: Partial<Equipo> = {}): Equipo =>
  ({ id: 4, nombre: 'Once Caldas', activo: true, ...extra }) as Equipo;

const jugador = (extra: Partial<Jugador> = {}): Jugador =>
  ({
    id: 7,
    tipoDocumento: TipoDocumento.CC,
    numeroDocumento: '1053000000',
    nombres: 'Juan',
    apellidos: 'Pérez',
    fechaNacimiento: '2002-05-10',
    email: 'juan@correo.com',
    telefono: '3001234567',
    activo: true,
    fechaCreacion: new Date('2026-11-20T10:00:00'),
    ...extra,
  }) as Jugador;

const contrato = (extra: Partial<EquipoJugador> = {}): EquipoJugador =>
  ({
    id: 15,
    equipo: equipo(),
    jugador: jugador(),
    fechaInicio: '2026-01-01',
    fechaFin: '2027-12-31',
    fechaRetiro: null,
    activo: true,
    ...extra,
  }) as EquipoJugador;

const habilidad = (extra: Partial<Habilidad> = {}): Habilidad =>
  ({
    id: 2,
    nombre: 'Regate',
    descripcion: 'Capacidad de eludir rivales',
    categoria: CategoriaHabilidad.TECNICA,
    ...extra,
  }) as Habilidad;

const asignacionHabilidad = (
  extra: Partial<HabilidadJugador> = {},
): HabilidadJugador =>
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

describe('PerfilService', () => {
  let service: PerfilService;

  const jugadorRepo = {
    findOneBy: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };
  const equipoJugadorRepo = {
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };
  const habilidadJugadorRepo = {
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    jest.setSystemTime(AHORA);

    jugadorRepo.findOneBy.mockResolvedValue(jugador());
    equipoJugadorRepo.find.mockResolvedValue([]);
    habilidadJugadorRepo.find.mockResolvedValue([]);

    const modulo = await Test.createTestingModule({
      providers: [
        PerfilService,
        { provide: getRepositoryToken(Jugador), useValue: jugadorRepo },
        {
          provide: getRepositoryToken(EquipoJugador),
          useValue: equipoJugadorRepo,
        },
        {
          provide: getRepositoryToken(HabilidadJugador),
          useValue: habilidadJugadorRepo,
        },
      ],
    }).compile();

    service = modulo.get(PerfilService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('obtenerPerfil', () => {
    it('lanza NOT_FOUND si el jugador no existe y no consulta contratos ni habilidades', async () => {
      jugadorRepo.findOneBy.mockResolvedValue(null);

      await esperarErrorCase(service.obtenerPerfil(999), ErrorCase.NOT_FOUND);

      expect(jugadorRepo.findOneBy).toHaveBeenCalledWith({ id: 999 });
      expect(equipoJugadorRepo.find).not.toHaveBeenCalled();
      expect(habilidadJugadorRepo.find).not.toHaveBeenCalled();
    });

    it('caso feliz: consolida jugador, equiposActuales, historialEquipos y habilidades sin escribir en BD', async () => {
      equipoJugadorRepo.find.mockResolvedValue([
        contrato({
          id: 15,
          equipo: equipo({ id: 4, nombre: 'Once Caldas', activo: true }),
          fechaInicio: '2026-01-01',
          fechaFin: '2027-12-31',
          fechaRetiro: null,
          activo: true,
        }),
        contrato({
          id: 12,
          equipo: equipo({ id: 9, nombre: 'Deportes Pereira', activo: true }),
          fechaInicio: '2024-01-01',
          fechaFin: '2025-12-31',
          fechaRetiro: '2025-06-30',
          activo: false,
        }),
      ]);
      habilidadJugadorRepo.find.mockResolvedValue([
        asignacionHabilidad({
          habilidad: habilidad({
            id: 2,
            nombre: 'Regate',
            categoria: CategoriaHabilidad.TECNICA,
          }),
        }),
        asignacionHabilidad({
          id: 11,
          habilidad: habilidad({
            id: 3,
            nombre: 'Velocidad',
            categoria: CategoriaHabilidad.FISICA,
          }),
        }),
      ]);

      const perfil = await service.obtenerPerfil(7);

      expect(jugadorRepo.findOneBy).toHaveBeenCalledWith({ id: 7 });
      expect(equipoJugadorRepo.find).toHaveBeenCalledWith({
        where: { jugador: { id: 7 } },
        relations: { equipo: true },
        order: { fechaInicio: 'DESC' },
      });
      expect(habilidadJugadorRepo.find).toHaveBeenCalledWith({
        where: { jugador: { id: 7 } },
        relations: { habilidad: true },
        order: { habilidad: { nombre: 'ASC' } },
      });

      expect(perfil.jugador).not.toBeInstanceOf(Jugador);
      expect(perfil).toEqual({
        jugador: {
          id: 7,
          tipoDocumento: TipoDocumento.CC,
          numeroDocumento: '1053000000',
          nombreCompleto: 'Juan Pérez',
          fechaNacimiento: '2002-05-10',
          edad: 24,
          email: 'juan@correo.com',
          telefono: '3001234567',
          activo: true,
        },
        equiposActuales: [
          {
            equipo: { id: 4, nombre: 'Once Caldas', activo: true },
            fechaInicio: '2026-01-01',
            fechaFin: '2027-12-31',
          },
        ],
        historialEquipos: [
          {
            equipo: { id: 9, nombre: 'Deportes Pereira', activo: true },
            fechaInicio: '2024-01-01',
            fechaFin: '2025-12-31',
            fechaRetiro: '2025-06-30',
          },
        ],
        habilidades: [
          { id: 2, nombre: 'Regate', categoria: CategoriaHabilidad.TECNICA },
          { id: 3, nombre: 'Velocidad', categoria: CategoriaHabilidad.FISICA },
        ],
        tieneEquipos: true,
        tieneHabilidades: true,
        mensajes: [],
      });

      // Consulta de solo lectura (ACUERDOS 7 y 13.3).
      expect(jugadorRepo.save).not.toHaveBeenCalled();
      expect(jugadorRepo.remove).not.toHaveBeenCalled();
      expect(jugadorRepo.delete).not.toHaveBeenCalled();
      expect(equipoJugadorRepo.save).not.toHaveBeenCalled();
      expect(equipoJugadorRepo.remove).not.toHaveBeenCalled();
      expect(equipoJugadorRepo.delete).not.toHaveBeenCalled();
      expect(habilidadJugadorRepo.save).not.toHaveBeenCalled();
      expect(habilidadJugadorRepo.remove).not.toHaveBeenCalled();
      expect(habilidadJugadorRepo.delete).not.toHaveBeenCalled();
    });

    it('informa ambos mensajes cuando el jugador no tiene equipos ni habilidades', async () => {
      const perfil = await service.obtenerPerfil(7);

      expect(perfil.equiposActuales).toEqual([]);
      expect(perfil.historialEquipos).toEqual([]);
      expect(perfil.habilidades).toEqual([]);
      expect(perfil.tieneEquipos).toBe(false);
      expect(perfil.tieneHabilidades).toBe(false);
      expect(perfil.mensajes).toEqual([
        'El jugador no tiene equipos asociados',
        'El jugador no tiene habilidades registradas',
      ]);
    });

    it('permite consultar el perfil de un jugador inactivo devolviendo activo=false', async () => {
      jugadorRepo.findOneBy.mockResolvedValue(jugador({ activo: false }));

      const perfil = await service.obtenerPerfil(7);

      expect(perfil.jugador.activo).toBe(false);
      expect(perfil.tieneEquipos).toBe(false);
      expect(perfil.tieneHabilidades).toBe(false);
    });
  });
});
