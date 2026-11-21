// Mocks virtuales: entidades de A y C que aún no están en main.
jest.mock(
  '../../equipo/entities/equipo.entity',
  () => ({ Equipo: class Equipo {} }),
  { virtual: true },
);
jest.mock(
  '../../escenario/entities/escenario.entity',
  () => ({ Escenario: class Escenario {} }),
  { virtual: true },
);
jest.mock(
  '../../fase/entities/fase.entity',
  () => {
    class Fase {}
    class Grupo extends Fase {}
    class FaseFinal extends Fase {}
    return { Fase, Grupo, FaseFinal };
  },
  { virtual: true },
);
jest.mock(
  '../../fase/entities/tipo-fase.enum',
  () => ({ TipoFase: { GRUPO: 'GRUPO', FINAL: 'FINAL' } }),
  { virtual: true },
);
jest.mock(
  '../../fase/entities/ronda-final.enum',
  () => ({ RondaFinal: { FINAL: 'FINAL', CUARTOS: 'CUARTOS' } }),
  { virtual: true },
);

import { Equipo } from '../../equipo/entities/equipo.entity';
import { Jugador } from '../../jugador/entities/jugador.entity';
import { TipoDocumento } from '../../jugador/entities/tipo-documento.enum';
import { CrearAnotacionDto } from '../dto/crear-anotacion.dto';
import { Anotacion } from '../entities/anotacion.entity';
import { Partido } from '../entities/partido.entity';
import { AnotacionMapper } from './anotacion.mapper';

const jugador = (): Jugador =>
  ({
    id: 7,
    tipoDocumento: TipoDocumento.CC,
    numeroDocumento: '1053000000',
    nombres: 'Juan',
    apellidos: 'Pérez',
    fechaNacimiento: '2000-01-01',
    email: 'juan@correo.com',
    telefono: '3000000000',
    activo: true,
    fechaCreacion: new Date(2026, 10, 1, 10, 0, 0),
  }) as unknown as Jugador;

const partido = (): Partido => ({ id: 20 }) as unknown as Partido;

const equipo = (): Equipo =>
  ({ id: 4, nombre: 'Once Caldas', activo: true }) as unknown as Equipo;

const anotacion = (extra: Record<string, unknown> = {}): Anotacion =>
  ({
    id: 50,
    partido: partido(),
    jugador: jugador(),
    minuto: 34,
    valor: 1,
    descripcion: 'Gol de cabeza',
    fechaRegistro: new Date(2026, 11, 5, 16, 5, 0),
    ...extra,
  }) as unknown as Anotacion;

describe('AnotacionMapper', () => {
  describe('aResponse (AnotacionResponse de ACUERDOS 9.11)', () => {
    it('devuelve exactamente el JSON del contrato', () => {
      expect(AnotacionMapper.aResponse(anotacion(), equipo())).toEqual({
        id: 50,
        partidoId: 20,
        jugador: {
          id: 7,
          tipoDocumento: 'CC',
          numeroDocumento: '1053000000',
          nombreCompleto: 'Juan Pérez',
          activo: true,
        },
        equipo: { id: 4, nombre: 'Once Caldas', activo: true },
        minuto: 34,
        valor: 1,
        descripcion: 'Gol de cabeza',
        fechaRegistro: '2026-12-05T16:05:00',
      });
    });

    it('tiene EXACTAMENTE las 8 claves del contrato, ni una más', () => {
      const r = AnotacionMapper.aResponse(anotacion(), equipo());
      expect(Object.keys(r).sort()).toEqual(
        [
          'id',
          'partidoId',
          'jugador',
          'equipo',
          'minuto',
          'valor',
          'descripcion',
          'fechaRegistro',
        ].sort(),
      );
    });

    it('el jugador es un JugadorResumen (5 claves), no el jugador completo', () => {
      const r = AnotacionMapper.aResponse(anotacion(), equipo());
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

    it('el equipo es un EquipoResumen (id, nombre, activo)', () => {
      const r = AnotacionMapper.aResponse(anotacion(), equipo());
      expect(Object.keys(r.equipo as object).sort()).toEqual(
        ['id', 'nombre', 'activo'].sort(),
      );
    });

    it('fechaRegistro Date → "yyyy-MM-ddTHH:mm:ss" con ceros a la izquierda', () => {
      const r = AnotacionMapper.aResponse(
        anotacion({ fechaRegistro: new Date(2026, 0, 3, 4, 5, 6) }),
        equipo(),
      );
      expect(r.fechaRegistro).toBe('2026-01-03T04:05:06');
    });

    it('minuto y descripcion null salen como null (la clave siempre está)', () => {
      const r = AnotacionMapper.aResponse(
        anotacion({ minuto: null, descripcion: null }),
        equipo(),
      );
      expect(r).toHaveProperty('minuto', null);
      expect(r).toHaveProperty('descripcion', null);
    });

    it('un minuto 0 sale como 0 (no se confunde con null)', () => {
      const r = AnotacionMapper.aResponse(anotacion({ minuto: 0 }), equipo());
      expect(r.minuto).toBe(0);
    });

    it('sin equipo deducido, equipo sale null (la clave sigue en el JSON)', () => {
      const r = AnotacionMapper.aResponse(anotacion(), null);
      expect(r).toHaveProperty('equipo', null);
    });

    it('no devuelve una instancia de la entidad Anotacion', () => {
      const r = AnotacionMapper.aResponse(anotacion(), equipo());
      expect(r).not.toBeInstanceOf(Anotacion);
    });
  });

  describe('aDatosEntidad', () => {
    const dto = (extra: Partial<CrearAnotacionDto> = {}): CrearAnotacionDto =>
      ({
        jugadorId: 7,
        minuto: 34,
        valor: 3,
        descripcion: 'Triple',
        ...extra,
      }) as CrearAnotacionDto;

    it('copia minuto, valor y descripcion, y enlaza el partido y el jugador ya buscados', () => {
      const p = partido();
      const j = jugador();
      const datos = AnotacionMapper.aDatosEntidad(dto(), p, j);
      expect(datos.partido).toBe(p);
      expect(datos.jugador).toBe(j);
      expect(datos.minuto).toBe(34);
      expect(datos.valor).toBe(3);
      expect(datos.descripcion).toBe('Triple');
    });

    it('valor ausente → 1 (default de 6.13)', () => {
      const datos = AnotacionMapper.aDatosEntidad(
        dto({ valor: undefined }),
        partido(),
        jugador(),
      );
      expect(datos.valor).toBe(1);
    });

    it('valor null → 1', () => {
      const datos = AnotacionMapper.aDatosEntidad(
        dto({ valor: null }),
        partido(),
        jugador(),
      );
      expect(datos.valor).toBe(1);
    });

    it('minuto 0 se conserva en 0 (no pasa a null)', () => {
      const datos = AnotacionMapper.aDatosEntidad(
        dto({ minuto: 0 }),
        partido(),
        jugador(),
      );
      expect(datos.minuto).toBe(0);
    });

    it('minuto y descripcion ausentes → null', () => {
      const datos = AnotacionMapper.aDatosEntidad(
        { jugadorId: 7 } as CrearAnotacionDto,
        partido(),
        jugador(),
      );
      expect(datos.minuto).toBeNull();
      expect(datos.descripcion).toBeNull();
    });

    it('no copia jugadorId ni id al objeto de la entidad', () => {
      const datos = AnotacionMapper.aDatosEntidad(
        { ...dto(), id: 999 } as CrearAnotacionDto,
        partido(),
        jugador(),
      );
      expect(datos).not.toHaveProperty('jugadorId');
      expect(datos).not.toHaveProperty('id');
    });
  });
});
