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

  // ACUERDOS 5.6: JugadorResumen = { id, tipoDocumento, numeroDocumento, nombreCompleto, activo }.
  describe('aResumen', () => {
    const jugador = {
      id: 7,
      tipoDocumento: TipoDocumento.CC,
      numeroDocumento: '1053000000',
      nombres: 'Juan Carlos',
      apellidos: 'Pérez Gómez',
      fechaNacimiento: '2002-05-10',
      email: 'juan@correo.com',
      telefono: '3001234567',
      activo: false,
      fechaCreacion: new Date('2026-11-20 10:00:00'),
    } as Jugador;

    it('devuelve exactamente las 5 claves del contrato (nada más)', () => {
      expect(Object.keys(JugadorMapper.aResumen(jugador)).sort()).toEqual(
        [
          'activo',
          'id',
          'nombreCompleto',
          'numeroDocumento',
          'tipoDocumento',
        ].sort(),
      );
    });

    it('nombreCompleto es "nombres apellidos"', () => {
      expect(JugadorMapper.aResumen(jugador).nombreCompleto).toBe(
        'Juan Carlos Pérez Gómez',
      );
    });

    it('copia los valores tal cual (incluido activo = false)', () => {
      expect(JugadorMapper.aResumen(jugador)).toEqual({
        id: 7,
        tipoDocumento: 'CC',
        numeroDocumento: '1053000000',
        nombreCompleto: 'Juan Carlos Pérez Gómez',
        activo: false,
      });
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
        // TypeORM 1.1.2 entrega DATETIME como Date (new Date(texto), hora local).
        fechaCreacion: new Date('2026-11-20 10:00:00'),
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

    it('convierte fechaCreacion (Date) a "yyyy-MM-ddTHH:mm:ss"', () => {
      expect(JugadorMapper.aResponse(crearJugador()).fechaCreacion).toBe(
        '2026-11-20T10:00:00',
      );
    });

    it('convierte fechaCreacion "yyyy-MM-dd HH:mm:ss" (texto) a "yyyy-MM-ddTHH:mm:ss"', () => {
      const r = JugadorMapper.aResponse(
        crearJugador({
          fechaCreacion: '2026-11-20 10:00:00' as unknown as Date,
        }),
      );
      expect(r.fechaCreacion).toBe('2026-11-20T10:00:00');
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
