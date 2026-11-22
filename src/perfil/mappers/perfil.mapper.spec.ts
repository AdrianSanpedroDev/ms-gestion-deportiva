// =====================================================================================
// TEMPORAL: quitar el jest.mock virtual cuando A suba equipo/entities/equipo.entity.ts
// =====================================================================================
jest.mock(
  '../../equipo/entities/equipo.entity',
  () => ({ Equipo: class Equipo {} }),
  { virtual: true },
);

import type { Equipo } from '../../equipo/entities/equipo.entity';
import { CategoriaHabilidad } from '../../habilidad/entities/categoria-habilidad.enum';
import { Habilidad } from '../../habilidad/entities/habilidad.entity';
import { HabilidadJugador } from '../../habilidad-jugador/entities/habilidad-jugador.entity';
import { EquipoJugador } from '../../jugador/entities/equipo-jugador.entity';
import { Jugador } from '../../jugador/entities/jugador.entity';
import { TipoDocumento } from '../../jugador/entities/tipo-documento.enum';
import { PerfilMapper } from './perfil.mapper';

const HOY = '2026-11-22';

const crearEquipo = (extra: Partial<Equipo> = {}): Equipo =>
  ({
    id: 4,
    nombre: 'Once Caldas',
    activo: true,
    ...extra,
  }) as Equipo;

const crearJugador = (extra: Partial<Jugador> = {}): Jugador =>
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

const crearContrato = (extra: Partial<EquipoJugador> = {}): EquipoJugador =>
  ({
    id: 15,
    equipo: crearEquipo(),
    jugador: crearJugador(),
    fechaInicio: '2026-01-01',
    fechaFin: '2027-12-31',
    fechaRetiro: null,
    activo: true,
    ...extra,
  }) as EquipoJugador;

const crearHabilidad = (extra: Partial<Habilidad> = {}): Habilidad =>
  ({
    id: 2,
    nombre: 'Regate',
    descripcion: 'Capacidad de eludir rivales',
    categoria: CategoriaHabilidad.TECNICA,
    fechaCreacion: new Date('2026-11-20T10:00:00'),
    ...extra,
  }) as Habilidad;

const crearAsignacion = (
  extra: Partial<HabilidadJugador> = {},
): HabilidadJugador =>
  ({
    id: 10,
    jugador: crearJugador(),
    habilidad: crearHabilidad(),
    fechaAsignacion: new Date('2026-11-22T15:00:00'),
    ...extra,
  }) as HabilidadJugador;

describe('PerfilMapper', () => {
  describe('aJugadorPerfil', () => {
    it('devuelve exactamente las 9 claves de JugadorPerfilDto (ACUERDOS 9.13)', () => {
      const dto = PerfilMapper.aJugadorPerfil(crearJugador(), HOY);

      expect(dto).toEqual({
        id: 7,
        tipoDocumento: TipoDocumento.CC,
        numeroDocumento: '1053000000',
        nombreCompleto: 'Juan Pérez',
        fechaNacimiento: '2002-05-10',
        edad: 24,
        email: 'juan@correo.com',
        telefono: '3001234567',
        activo: true,
      });
      expect(Object.keys(dto).sort()).toEqual([
        'activo',
        'edad',
        'email',
        'fechaNacimiento',
        'id',
        'nombreCompleto',
        'numeroDocumento',
        'telefono',
        'tipoDocumento',
      ]);
    });

    it('calcula correctamente la edad cuando el cumpleaños aún no llega y cuando es hoy', () => {
      const antesDeCumple = PerfilMapper.aJugadorPerfil(
        crearJugador({ fechaNacimiento: '2002-11-23' }),
        HOY,
      );
      const mismoDia = PerfilMapper.aJugadorPerfil(
        crearJugador({ fechaNacimiento: '2002-11-22' }),
        HOY,
      );

      expect(antesDeCumple.edad).toBe(23);
      expect(mismoDia.edad).toBe(24);
    });

    it('conserva email y telefono como null cuando no están registrados', () => {
      const dto = PerfilMapper.aJugadorPerfil(
        crearJugador({ email: null, telefono: null }),
        HOY,
      );

      expect(dto.email).toBeNull();
      expect(dto.telefono).toBeNull();
    });
  });

  describe('aResponse', () => {
    it('arma el perfil completo separando equiposActuales e historialEquipos con mensajes vacíos', () => {
      const contratoActual = crearContrato({
        id: 15,
        equipo: crearEquipo({ id: 4, nombre: 'Once Caldas', activo: true }),
        fechaInicio: '2026-01-01',
        fechaFin: '2027-12-31',
        fechaRetiro: null,
        activo: true,
      });
      const contratoRetirado = crearContrato({
        id: 12,
        equipo: crearEquipo({
          id: 9,
          nombre: 'Deportes Pereira',
          activo: true,
        }),
        fechaInicio: '2024-01-01',
        fechaFin: '2025-12-31',
        fechaRetiro: '2025-06-30',
        activo: false,
      });
      const asignacion = crearAsignacion();

      const respuesta = PerfilMapper.aResponse(
        crearJugador(),
        [contratoActual, contratoRetirado],
        [asignacion],
        HOY,
      );

      expect(respuesta).toEqual({
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
          {
            id: 2,
            nombre: 'Regate',
            categoria: CategoriaHabilidad.TECNICA,
          },
        ],
        tieneEquipos: true,
        tieneHabilidades: true,
        mensajes: [],
      });

      expect(Object.keys(respuesta.equiposActuales[0]).sort()).toEqual([
        'equipo',
        'fechaFin',
        'fechaInicio',
      ]);
      expect(Object.keys(respuesta.historialEquipos[0]).sort()).toEqual([
        'equipo',
        'fechaFin',
        'fechaInicio',
        'fechaRetiro',
      ]);
      expect(Object.keys(respuesta.habilidades[0]).sort()).toEqual([
        'categoria',
        'id',
        'nombre',
      ]);
    });

    it('marca tieneEquipos=false y agrega mensaje exacto si solo tiene historial y ningún equipo activo', () => {
      const contratoRetirado = crearContrato({
        id: 12,
        equipo: crearEquipo({ id: 9, nombre: 'Deportes Pereira' }),
        fechaInicio: '2024-01-01',
        fechaFin: '2025-12-31',
        fechaRetiro: '2025-06-30',
        activo: false,
      });

      const respuesta = PerfilMapper.aResponse(
        crearJugador(),
        [contratoRetirado],
        [crearAsignacion()],
        HOY,
      );

      expect(respuesta.equiposActuales).toEqual([]);
      expect(respuesta.historialEquipos).toHaveLength(1);
      expect(respuesta.tieneEquipos).toBe(false);
      expect(respuesta.tieneHabilidades).toBe(true);
      expect(respuesta.mensajes).toEqual([
        'El jugador no tiene equipos asociados',
      ]);
    });

    it('marca tieneHabilidades=false y agrega mensaje exacto cuando no tiene habilidades', () => {
      const respuesta = PerfilMapper.aResponse(
        crearJugador(),
        [crearContrato()],
        [],
        HOY,
      );

      expect(respuesta.habilidades).toEqual([]);
      expect(respuesta.tieneEquipos).toBe(true);
      expect(respuesta.tieneHabilidades).toBe(false);
      expect(respuesta.mensajes).toEqual([
        'El jugador no tiene habilidades registradas',
      ]);
    });

    it('agrega ambos mensajes cuando no tiene equipos activos ni habilidades registradas', () => {
      const respuesta = PerfilMapper.aResponse(crearJugador(), [], [], HOY);

      expect(respuesta.equiposActuales).toEqual([]);
      expect(respuesta.historialEquipos).toEqual([]);
      expect(respuesta.habilidades).toEqual([]);
      expect(respuesta.tieneEquipos).toBe(false);
      expect(respuesta.tieneHabilidades).toBe(false);
      expect(respuesta.mensajes).toEqual([
        'El jugador no tiene equipos asociados',
        'El jugador no tiene habilidades registradas',
      ]);
    });
  });
});
