import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CrearHabilidadDto } from './crear-habilidad.dto';

// Simula el ValidationPipe global: transformar (con @Transform) y luego validar.
async function validar(body: object) {
  const dto = plainToInstance(CrearHabilidadDto, body);
  const errores = await validate(dto);
  return { dto, errores };
}

const valido = {
  nombre: 'Regate',
  descripcion: 'Capacidad de eludir rivales',
  categoria: 'TECNICA',
};

const campos = (errores: { property: string }[]) =>
  errores.map((e) => e.property);

// Primer mensaje de un campo: es el que muestra el filtro de errores (decorador más cercano a la propiedad).
const primerMensaje = (
  errores: { property: string; constraints?: Record<string, string> }[],
  campo: string,
) =>
  Object.values(
    errores.find((e) => e.property === campo)?.constraints ?? {},
  )[0];

describe('CrearHabilidadDto', () => {
  describe('mensajes de campos obligatorios', () => {
    it('si falta nombre, el primer mensaje es el de "obligatorio"', async () => {
      const { nombre, ...sinNombre } = valido;
      void nombre;
      const { errores } = await validar(sinNombre);
      expect(primerMensaje(errores, 'nombre')).toBe('El nombre es obligatorio');
    });

    it('si falta categoria, el primer mensaje es el de "obligatoria"', async () => {
      const { categoria, ...sinCategoria } = valido;
      void categoria;
      const { errores } = await validar(sinCategoria);
      expect(primerMensaje(errores, 'categoria')).toBe(
        'La categoría es obligatoria',
      );
    });

    it('{} da el mensaje "obligatorio" en nombre y en categoria', async () => {
      const { errores } = await validar({});
      expect(primerMensaje(errores, 'nombre')).toContain('obligatorio');
      expect(primerMensaje(errores, 'categoria')).toContain('obligatoria');
    });

    it('categoria " TECNICA" (con espacio) se recorta y pasa', async () => {
      const { dto, errores } = await validar({
        ...valido,
        categoria: ' TECNICA',
      });
      expect(errores).toHaveLength(0);
      expect(dto.categoria).toBe('TECNICA');
    });
  });

  it('acepta el body completo del contrato (9.9)', async () => {
    const { errores } = await validar(valido);
    expect(errores).toHaveLength(0);
  });

  describe('nombre', () => {
    it('es obligatorio: falla si no viene', async () => {
      const { nombre, ...sinNombre } = valido;
      void nombre;
      const { errores } = await validar(sinNombre);
      expect(campos(errores)).toContain('nombre');
    });

    it('rechaza un nombre de solo espacios', async () => {
      const { errores } = await validar({ ...valido, nombre: '   ' });
      expect(campos(errores)).toContain('nombre');
    });

    it('recorta espacios al inicio y al final (trim)', async () => {
      const { dto, errores } = await validar({
        ...valido,
        nombre: '  Regate  ',
      });
      expect(errores).toHaveLength(0);
      expect(dto.nombre).toBe('Regate');
    });

    it('acepta exactamente 100 caracteres', async () => {
      const { errores } = await validar({ ...valido, nombre: 'a'.repeat(100) });
      expect(errores).toHaveLength(0);
    });

    it('rechaza 101 caracteres', async () => {
      const { errores } = await validar({ ...valido, nombre: 'a'.repeat(101) });
      expect(campos(errores)).toContain('nombre');
    });

    it('rechaza un nombre que no es texto', async () => {
      const { errores } = await validar({ ...valido, nombre: 123 });
      expect(campos(errores)).toContain('nombre');
    });
  });

  describe('descripcion', () => {
    it('es opcional: sin descripción no hay error', async () => {
      const { descripcion, ...sinDescripcion } = valido;
      void descripcion;
      const { errores } = await validar(sinDescripcion);
      expect(errores).toHaveLength(0);
    });

    it('"" se vuelve null y no da error', async () => {
      const { dto, errores } = await validar({ ...valido, descripcion: '' });
      expect(errores).toHaveLength(0);
      expect(dto.descripcion).toBeNull();
    });

    it('solo espacios se vuelve null y no da error', async () => {
      const { dto, errores } = await validar({ ...valido, descripcion: '   ' });
      expect(errores).toHaveLength(0);
      expect(dto.descripcion).toBeNull();
    });

    it('recorta espacios de una descripción con texto', async () => {
      const { dto } = await validar({ ...valido, descripcion: '  hola  ' });
      expect(dto.descripcion).toBe('hola');
    });

    it('acepta exactamente 500 caracteres', async () => {
      const { errores } = await validar({
        ...valido,
        descripcion: 'a'.repeat(500),
      });
      expect(errores).toHaveLength(0);
    });

    it('rechaza 501 caracteres', async () => {
      const { errores } = await validar({
        ...valido,
        descripcion: 'a'.repeat(501),
      });
      expect(campos(errores)).toContain('descripcion');
    });
  });

  describe('categoria', () => {
    it('es obligatoria: falla si no viene', async () => {
      const { categoria, ...sinCategoria } = valido;
      void categoria;
      const { errores } = await validar(sinCategoria);
      expect(campos(errores)).toContain('categoria');
    });

    it.each(['TECNICA', 'FISICA', 'TACTICA', 'MENTAL'])(
      'acepta %s',
      async (categoria) => {
        const { errores } = await validar({ ...valido, categoria });
        expect(errores).toHaveLength(0);
      },
    );

    it('rechaza minúsculas ("tecnica")', async () => {
      const { errores } = await validar({ ...valido, categoria: 'tecnica' });
      expect(campos(errores)).toContain('categoria');
    });

    it('rechaza un valor fuera del enum', async () => {
      const { errores } = await validar({ ...valido, categoria: 'SOCIAL' });
      expect(campos(errores)).toContain('categoria');
    });

    it('rechaza cadena vacía', async () => {
      const { errores } = await validar({ ...valido, categoria: '' });
      expect(campos(errores)).toContain('categoria');
    });
  });
});
