// (la entidad EquipoJugador importa Equipo en tiempo de ejecución).

import type { Equipo } from '../../equipo/entities/equipo.entity';
import { EquipoJugador } from '../entities/equipo-jugador.entity';
import { Jugador } from '../entities/jugador.entity';
import { EquipoJugadorMapper } from './equipo-jugador.mapper';

const equipo = { id: 4, nombre: 'Once Caldas', activo: true } as Equipo;
const jugador = {
  id: 7,
  tipoDocumento: 'CC',
  numeroDocumento: '1053000000',
  nombres: 'Juan',
  apellidos: 'Pérez',
  email: 'juan@correo.com',
  telefono: '3001234567',
  activo: true,
} as Jugador;

const contrato = (extra: Partial<EquipoJugador> = {}): EquipoJugador =>
  ({
    id: 15,
    equipo,
    jugador,
    fechaInicio: '2026-01-01',
    fechaFin: '2027-12-31',
    fechaRetiro: null,
    activo: true,
    ...extra,
  }) as EquipoJugador;

describe('EquipoJugadorMapper', () => {
  describe('aResponse', () => {
    it('arma el ContratoResponse exacto del contrato 9.8', () => {
      expect(EquipoJugadorMapper.aResponse(contrato())).toEqual({
        id: 15,
        jugador: {
          id: 7,
          tipoDocumento: 'CC',
          numeroDocumento: '1053000000',
          nombreCompleto: 'Juan Pérez',
          activo: true,
        },
        equipo: { id: 4, nombre: 'Once Caldas', activo: true },
        fechaInicio: '2026-01-01',
        fechaFin: '2027-12-31',
        fechaRetiro: null,
        activo: true,
      });
    });

    it('el jugador resumido trae solo 5 campos (no filtra email ni teléfono)', () => {
      const r = EquipoJugadorMapper.aResponse(contrato());
      expect(Object.keys(r.jugador).sort()).toEqual(
        [
          'id',
          'tipoDocumento',
          'numeroDocumento',
          'nombreCompleto',
          'activo',
        ].sort(),
      );
    });

    it('el equipo resumido trae solo id, nombre y activo', () => {
      const r = EquipoJugadorMapper.aResponse(contrato());
      expect(Object.keys(r.equipo).sort()).toEqual(['activo', 'id', 'nombre']);
    });

    it('la respuesta no trae propiedades fuera del contrato', () => {
      const r = EquipoJugadorMapper.aResponse(contrato());
      expect(Object.keys(r).sort()).toEqual(
        [
          'id',
          'jugador',
          'equipo',
          'fechaInicio',
          'fechaFin',
          'fechaRetiro',
          'activo',
        ].sort(),
      );
    });

    it('nombreCompleto es "nombres apellidos"', () => {
      const r = EquipoJugadorMapper.aResponse(
        contrato({
          jugador: {
            ...jugador,
            nombres: 'Ana María',
            apellidos: 'Gómez',
          } as Jugador,
        }),
      );
      expect(r.jugador.nombreCompleto).toBe('Ana María Gómez');
    });

    it('fechaRetiro null sale como null (la clave siempre está)', () => {
      const r = EquipoJugadorMapper.aResponse(contrato({ fechaRetiro: null }));
      expect(r).toHaveProperty('fechaRetiro', null);
    });

    it('una fechaRetiro ausente (undefined) también sale como null, no como undefined', () => {
      const c = contrato();
      delete (c as Partial<EquipoJugador>).fechaRetiro;
      expect(EquipoJugadorMapper.aResponse(c)).toHaveProperty(
        'fechaRetiro',
        null,
      );
    });

    it('con contrato retirado conserva fechaRetiro y activo=false', () => {
      const r = EquipoJugadorMapper.aResponse(
        contrato({ activo: false, fechaRetiro: '2026-12-01' }),
      );
      expect(r.fechaRetiro).toBe('2026-12-01');
      expect(r.activo).toBe(false);
    });

    it('refleja jugador y equipo inactivos', () => {
      const r = EquipoJugadorMapper.aResponse(
        contrato({
          jugador: { ...jugador, activo: false } as Jugador,
          equipo: { ...equipo, activo: false } as Equipo,
        }),
      );
      expect(r.jugador.activo).toBe(false);
      expect(r.equipo.activo).toBe(false);
    });

    it('las fechas DATE salen "yyyy-MM-dd" sin cambios (5.5)', () => {
      const r = EquipoJugadorMapper.aResponse(contrato());
      expect(r.fechaInicio).toBe('2026-01-01');
      expect(r.fechaFin).toBe('2027-12-31');
    });
  });

  describe('aDatosEntidad', () => {
    const dto = {
      jugadorId: 7,
      fechaInicio: '2026-01-01',
      fechaFin: '2027-12-31',
    };

    it('copia fechas, equipo y jugador; el contrato nace activo y sin retiro', () => {
      const d = EquipoJugadorMapper.aDatosEntidad(dto, equipo, jugador);
      expect(d.equipo).toBe(equipo);
      expect(d.jugador).toBe(jugador);
      expect(d.fechaInicio).toBe('2026-01-01');
      expect(d.fechaFin).toBe('2027-12-31');
      expect(d.activo).toBe(true);
      expect(d.fechaRetiro ?? null).toBeNull();
    });

    it('no copia un id ni jugadorId a la entidad', () => {
      const d = EquipoJugadorMapper.aDatosEntidad(dto, equipo, jugador);
      expect(d).not.toHaveProperty('id');
      expect(d).not.toHaveProperty('jugadorId');
    });
  });
});
