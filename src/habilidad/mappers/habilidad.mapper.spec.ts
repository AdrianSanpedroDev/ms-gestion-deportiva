import { CrearHabilidadDto } from '../dto/crear-habilidad.dto';
import { CategoriaHabilidad } from '../entities/categoria-habilidad.enum';
import { Habilidad } from '../entities/habilidad.entity';
import { HabilidadMapper } from './habilidad.mapper';

const entidad = (extra: Partial<Habilidad> = {}): Habilidad =>
  ({
    id: 2,
    nombre: 'Regate',
    descripcion: 'Capacidad de eludir rivales',
    categoria: CategoriaHabilidad.TECNICA,
    // TypeORM 1.1.2 entrega DATETIME como Date (new Date(texto), hora local).
    fechaCreacion: new Date('2026-11-20 10:00:00'),
    ...extra,
  }) as Habilidad;

describe('HabilidadMapper', () => {
  describe('aResponse', () => {
    it('devuelve exactamente las claves de HabilidadResponse (9.9)', () => {
      const r = HabilidadMapper.aResponse(entidad());
      expect(Object.keys(r).sort()).toEqual(
        ['categoria', 'descripcion', 'fechaCreacion', 'id', 'nombre'].sort(),
      );
    });

    it('convierte fechaCreacion (Date) a "yyyy-MM-ddTHH:mm:ss" (5.5)', () => {
      const r = HabilidadMapper.aResponse(entidad());
      expect(r.fechaCreacion).toBe('2026-11-20T10:00:00');
    });

    it('convierte fechaCreacion "yyyy-MM-dd HH:mm:ss" (texto) a "yyyy-MM-ddTHH:mm:ss" (5.5)', () => {
      const r = HabilidadMapper.aResponse(
        entidad({ fechaCreacion: '2026-11-20 10:00:00' as unknown as Date }),
      );
      expect(r.fechaCreacion).toBe('2026-11-20T10:00:00');
    });

    it('copia id, nombre, descripcion y categoria', () => {
      expect(HabilidadMapper.aResponse(entidad())).toMatchObject({
        id: 2,
        nombre: 'Regate',
        descripcion: 'Capacidad de eludir rivales',
        categoria: 'TECNICA',
      });
    });

    it('descripcion null sale como null (la clave siempre está)', () => {
      const r = HabilidadMapper.aResponse(entidad({ descripcion: null }));
      expect(r).toHaveProperty('descripcion', null);
    });
  });

  describe('aDatosEntidad', () => {
    it('copia solo nombre, descripcion y categoria', () => {
      const dto = {
        nombre: 'Regate',
        descripcion: 'x',
        categoria: CategoriaHabilidad.FISICA,
        id: 99,
        fechaCreacion: '2000-01-01 00:00:00',
      } as unknown as CrearHabilidadDto;
      const datos = HabilidadMapper.aDatosEntidad(dto);
      expect(datos).toEqual({
        nombre: 'Regate',
        descripcion: 'x',
        categoria: 'FISICA',
      });
      expect(datos).not.toHaveProperty('id');
      expect(datos).not.toHaveProperty('fechaCreacion');
    });

    it('sin descripcion queda null', () => {
      const dto = {
        nombre: 'Regate',
        categoria: CategoriaHabilidad.MENTAL,
      } as CrearHabilidadDto;
      expect(HabilidadMapper.aDatosEntidad(dto).descripcion).toBeNull();
    });
  });
});
