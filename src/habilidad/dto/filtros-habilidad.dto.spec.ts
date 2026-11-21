import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FiltrosHabilidadDto } from './filtros-habilidad.dto';

async function validar(query: object) {
  const dto = plainToInstance(FiltrosHabilidadDto, query);
  const errores = await validate(dto);
  return { dto, errores };
}

const campos = (errores: { property: string }[]) =>
  errores.map((e) => e.property);

describe('FiltrosHabilidadDto (GET /api/habilidades?nombre=&categoria=)', () => {
  it('sin filtros no hay error (ambos son opcionales)', async () => {
    const { errores } = await validar({});
    expect(errores).toHaveLength(0);
  });

  it('el nombre es opcional y se acepta solo', async () => {
    const { errores } = await validar({ nombre: 'reg' });
    expect(errores).toHaveLength(0);
  });

  it('recorta espacios del nombre', async () => {
    const { dto } = await validar({ nombre: '  reg  ' });
    expect(dto.nombre).toBe('reg');
  });

  it.each(['TECNICA', 'FISICA', 'TACTICA', 'MENTAL'])(
    'acepta la categoría %s',
    async (categoria) => {
      const { errores } = await validar({ categoria });
      expect(errores).toHaveLength(0);
    },
  );

  it('rechaza una categoría inválida', async () => {
    const { errores } = await validar({ categoria: 'SOCIAL' });
    expect(campos(errores)).toContain('categoria');
  });

  it('rechaza una categoría en minúsculas', async () => {
    const { errores } = await validar({ categoria: 'fisica' });
    expect(campos(errores)).toContain('categoria');
  });

  it('"?categoria=" vacío se trata como sin filtro (no da error)', async () => {
    const { errores } = await validar({ categoria: '' });
    expect(errores).toHaveLength(0);
  });

  it.each(['', '   '])(
    'nombre %p (vacío o solo espacios) queda undefined, sin errores',
    async (nombre) => {
      const { dto, errores } = await validar({ nombre });
      expect(errores).toHaveLength(0);
      expect(dto.nombre).toBeUndefined();
    },
  );

  it.each(['', '   '])(
    'categoria %p (vacía o solo espacios) queda undefined (nunca null), sin errores',
    async (categoria) => {
      const { dto, errores } = await validar({ categoria });
      expect(errores).toHaveLength(0);
      expect(dto.categoria).toBeUndefined();
    },
  );

  it('nombre y categoria vacíos a la vez: ambos undefined', async () => {
    const { dto, errores } = await validar({ nombre: '', categoria: '' });
    expect(errores).toHaveLength(0);
    expect(dto.nombre).toBeUndefined();
    expect(dto.categoria).toBeUndefined();
  });

  it('acepta nombre y categoría a la vez', async () => {
    const { errores } = await validar({ nombre: 'reg', categoria: 'TECNICA' });
    expect(errores).toHaveLength(0);
  });
});
