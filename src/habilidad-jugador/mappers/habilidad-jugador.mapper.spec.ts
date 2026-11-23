import { CategoriaHabilidad } from '../../habilidad/entities/categoria-habilidad.enum';
import { Habilidad } from '../../habilidad/entities/habilidad.entity';
import { Jugador } from '../../jugador/entities/jugador.entity';
import { TipoDocumento } from '../../jugador/entities/tipo-documento.enum';
import { HabilidadJugadorMapper } from './habilidad-jugador.mapper';

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

const habilidad = (extra: Partial<Habilidad> = {}): Habilidad =>
  ({
    id: 2,
    nombre: 'Regate',
    descripcion: 'Capacidad de eludir rivales',
    categoria: CategoriaHabilidad.TECNICA,
    fechaCreacion: new Date('2026-11-20T10:00:00'),
    ...extra,
  }) as Habilidad;

describe('HabilidadJugadorMapper', () => {
  it('aDatosEntidad arma solo las relaciones jugador y habilidad', () => {
    const j = jugador();
    const h = habilidad();
    expect(HabilidadJugadorMapper.aDatosEntidad(j, h)).toEqual({
      jugador: j,
      habilidad: h,
    });
  });

  it('aHabilidadResumen devuelve exactamente los 3 campos de HabilidadResumen (ACUERDOS 5.6)', () => {
    const resumen = HabilidadJugadorMapper.aHabilidadResumen(habilidad());
    expect(resumen).toEqual({
      id: 2,
      nombre: 'Regate',
      categoria: CategoriaHabilidad.TECNICA,
    });
    expect(Object.keys(resumen).sort()).toEqual(['categoria', 'id', 'nombre']);
  });

  it('aJugadorResumen devuelve exactamente los 5 campos de JugadorResumen (ACUERDOS 5.6)', () => {
    const resumen = HabilidadJugadorMapper.aJugadorResumen(jugador());
    expect(resumen).toEqual({
      id: 7,
      tipoDocumento: TipoDocumento.CC,
      numeroDocumento: '1053000000',
      nombreCompleto: 'Juan Pérez',
      activo: true,
    });
  });
});
