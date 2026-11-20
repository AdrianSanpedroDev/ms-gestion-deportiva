import { Jugador } from '../entities/jugador.entity';
import { TipoDocumento } from '../entities/tipo-documento.enum';
import { JugadorMapper } from './jugador.mapper';

describe('JugadorMapper', () => {
  describe('calcularEdad', () => {
    it.each([
      ['2002-05-10', '2026-11-20', 24, 'ya cumplió este año'],
      ['2002-05-10', '2026-05-09', 23, 'cumple mañana: aún no'],
      ['2002-05-10', '2026-05-10', 24, 'cumple hoy: ya cuenta'],
      ['2002-12-01', '2026-11-20', 23, 'cumple después en el año'],
      ['2004-03-01', '2026-03-01', 22, 'cumple hoy (1 de marzo)'],
      ['2004-03-01', '2026-02-28', 21, 'un día antes del cumpleaños'],
      [
        '2004-02-29',
        '2026-02-28',
        21,
        'nació 29-feb, año no bisiesto, antes de marzo',
      ],
      [
        '2004-02-29',
        '2026-03-01',
        22,
        'nació 29-feb, año no bisiesto, ya en marzo',
      ],
    ])('nacido %s, hoy %s => %i (%s)', (nac, hoy, esperada) => {
      expect(JugadorMapper.calcularEdad(nac, hoy)).toBe(esperada);
    });
  });

  describe('aResponse', () => {
    const crearJugador = (parcial: Partial<Jugador> = {}): Jugador =>
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
        fechaCreacion: '2026-11-20 10:00:00',
        ...parcial,
      }) as Jugador;

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-11-20T15:00:00Z'));
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it('arma nombreCompleto como "nombres apellidos"', () => {
      expect(JugadorMapper.aResponse(crearJugador()).nombreCompleto).toBe(
        'Juan Pérez',
      );
    });

    it('copia los campos del contrato 9.7 y calcula la edad', () => {
      expect(JugadorMapper.aResponse(crearJugador())).toEqual({
        id: 7,
        tipoDocumento: 'CC',
        numeroDocumento: '1053000000',
        nombres: 'Juan',
        apellidos: 'Pérez',
        nombreCompleto: 'Juan Pérez',
        fechaNacimiento: '2002-05-10',
        edad: 24,
        email: 'juan@correo.com',
        telefono: '3001234567',
        activo: true,
        fechaCreacion: '2026-11-20T10:00:00',
      });
    });

    it('convierte fechaCreacion "yyyy-MM-dd HH:mm:ss" a "yyyy-MM-ddTHH:mm:ss"', () => {
      expect(JugadorMapper.aResponse(crearJugador()).fechaCreacion).toBe(
        '2026-11-20T10:00:00',
      );
    });

    it('mantiene email y telefono en null (no los cambia a undefined ni a "")', () => {
      const r = JugadorMapper.aResponse(
        crearJugador({ email: null, telefono: null }),
      );
      expect(r.email).toBeNull();
      expect(r.telefono).toBeNull();
    });

    it('conserva activo=false', () => {
      expect(
        JugadorMapper.aResponse(crearJugador({ activo: false })).activo,
      ).toBe(false);
    });

    it('no trae propiedades fuera del contrato 9.7', () => {
      const r = JugadorMapper.aResponse(crearJugador());
      expect(Object.keys(r).sort()).toEqual(
        [
          'id',
          'tipoDocumento',
          'numeroDocumento',
          'nombres',
          'apellidos',
          'nombreCompleto',
          'fechaNacimiento',
          'edad',
          'email',
          'telefono',
          'activo',
          'fechaCreacion',
        ].sort(),
      );
    });

    it('la edad usa el día de Colombia: 21:00 hora Bogotá del 09-may aún no cumple', () => {
      // 2026-05-10T02:00Z = 2026-05-09 21:00 en Bogotá (UTC-5) => todavía 23
      jest.setSystemTime(new Date('2026-05-10T02:00:00Z'));
      expect(JugadorMapper.aResponse(crearJugador()).edad).toBe(23);
    });
  });
});
