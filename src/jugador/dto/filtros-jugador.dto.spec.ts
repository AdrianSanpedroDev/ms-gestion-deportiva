import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FiltrosJugadorDto } from './filtros-jugador.dto';

// Contrato 9.7: GET /api/jugadores?busqueda=&activo= (ambos opcionales).
// Simula el ValidationPipe global: en la URL todo llega como texto.
async function validar(query: object) {
  const dto = plainToInstance(FiltrosJugadorDto, query);
  const errores = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return { dto, errores };
}

const campos = (errores: { property: string }[]) =>
  errores.map((e) => e.property);

describe('FiltrosJugadorDto', () => {
  it('sin filtros es válido y todo queda undefined', async () => {
    const { dto, errores } = await validar({});
    expect(errores).toHaveLength(0);
    expect(dto.busqueda).toBeUndefined();
    expect(dto.activo).toBeUndefined();
  });

  describe('busqueda', () => {
    it('acepta un texto', async () => {
      const { dto, errores } = await validar({ busqueda: 'Juan' });
      expect(errores).toHaveLength(0);
      expect(dto.busqueda).toBe('Juan');
    });

    it('recorta espacios', async () => {
      const { dto } = await validar({ busqueda: '  Juan  ' });
      expect(dto.busqueda).toBe('Juan');
    });

    it.each(['', '   '])(
      '%p (vacío o solo espacios) queda undefined y no da error',
      async (busqueda) => {
        const { dto, errores } = await validar({ busqueda });
        expect(errores).toHaveLength(0);
        expect(dto.busqueda).toBeUndefined();
      },
    );

    it('un valor que no es texto da error', async () => {
      const { errores } = await validar({ busqueda: ['a', 'b'] });
      expect(campos(errores)).toContain('busqueda');
    });
  });

  describe('activo', () => {
    it('"true" se convierte en true', async () => {
      const { dto, errores } = await validar({ activo: 'true' });
      expect(errores).toHaveLength(0);
      expect(dto.activo).toBe(true);
    });

    it('"false" se convierte en false (no se ignora)', async () => {
      const { dto, errores } = await validar({ activo: 'false' });
      expect(errores).toHaveLength(0);
      expect(dto.activo).toBe(false);
    });

    it('"?activo=" vacío es válido y queda undefined (sin filtro)', async () => {
      const { dto, errores } = await validar({ activo: '' });
      expect(errores).toHaveLength(0);
      expect(dto.activo).toBeUndefined();
    });

    it.each(['si', '1', 'TRUE', 'abc'])(
      '"%s" da error de @IsBoolean con mensaje en español',
      async (activo) => {
        const { errores } = await validar({ activo });
        expect(campos(errores)).toContain('activo');
        const mensajes = errores.flatMap((e) =>
          Object.values(e.constraints ?? {}),
        );
        expect(mensajes).toContain('activo debe ser true o false');
      },
    );
  });

  it('forbidNonWhitelisted rechaza parámetros desconocidos', async () => {
    const { errores } = await validar({ equipoId: '3' });
    expect(campos(errores)).toContain('equipoId');
  });
});
