import { aFechaHoraIso, hoyBogota } from './fechas';

// "Hoy" en Bogotá (UTC-5, sin horario de verano): a las 03:30 UTC todavía es el día anterior.
describe('hoyBogota', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('2026-11-21T03:30:00Z (22:30 del 20 en Bogotá) -> "2026-11-20"', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-21T03:30:00Z'));
    expect(hoyBogota()).toBe('2026-11-20');
  });

  it('2026-11-21T05:00:00Z (00:00 del 21 en Bogotá) -> "2026-11-21"', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-21T05:00:00Z'));
    expect(hoyBogota()).toBe('2026-11-21');
  });

  it('2026-11-21T04:59:59Z (23:59:59 del 20 en Bogotá) -> "2026-11-20"', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-21T04:59:59Z'));
    expect(hoyBogota()).toBe('2026-11-20');
  });

  it('el resultado tiene formato yyyy-MM-dd', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-05T15:00:00Z'));
    expect(hoyBogota()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// Contrato 5.5: las columnas DATETIME salen como "2026-12-05T15:30:00".
// TypeORM 1.1.2 las entrega como Date (hidrata con new Date(texto), hora local del servidor),
// por eso se usan los getters locales.
describe('aFechaHoraIso', () => {
  it('Date local 2026-11-20 09:05:03 -> "2026-11-20T09:05:03" (rellena con ceros)', () => {
    expect(aFechaHoraIso(new Date(2026, 10, 20, 9, 5, 3))).toBe(
      '2026-11-20T09:05:03',
    );
  });

  it('el mes se cuenta desde 1: enero (getMonth = 0) sale "01"', () => {
    expect(aFechaHoraIso(new Date(2026, 0, 5, 1, 2, 3))).toBe(
      '2026-01-05T01:02:03',
    );
  });

  it('diciembre (getMonth = 11) sale "12"', () => {
    expect(aFechaHoraIso(new Date(2026, 11, 31, 23, 59, 59))).toBe(
      '2026-12-31T23:59:59',
    );
  });

  it('medianoche sale 00:00:00', () => {
    expect(aFechaHoraIso(new Date(2026, 5, 1, 0, 0, 0))).toBe(
      '2026-06-01T00:00:00',
    );
  });

  it('ignora los milisegundos del Date', () => {
    expect(aFechaHoraIso(new Date(2026, 10, 20, 9, 5, 3, 987))).toBe(
      '2026-11-20T09:05:03',
    );
  });

  it('texto "2026-11-20 10:00:00" -> "2026-11-20T10:00:00"', () => {
    expect(aFechaHoraIso('2026-11-20 10:00:00')).toBe('2026-11-20T10:00:00');
  });

  it('texto con microsegundos "2026-11-20 10:00:00.000000" se recorta a 19 caracteres', () => {
    const r = aFechaHoraIso('2026-11-20 10:00:00.000000');
    expect(r).toBe('2026-11-20T10:00:00');
    expect(r).toHaveLength(19);
  });

  it('ida y vuelta: new Date("2026-11-20 10:00:00") (como hidrata TypeORM) -> "2026-11-20T10:00:00"', () => {
    expect(aFechaHoraIso(new Date('2026-11-20 10:00:00'))).toBe(
      '2026-11-20T10:00:00',
    );
  });

  it('el resultado siempre tiene el formato yyyy-MM-ddTHH:mm:ss', () => {
    expect(aFechaHoraIso(new Date(2026, 2, 3, 4, 5, 6))).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/,
    );
  });
});
