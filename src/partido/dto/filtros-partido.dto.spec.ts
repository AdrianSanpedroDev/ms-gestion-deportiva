import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FiltrosPartidoDto } from './filtros-partido.dto';
import { MENSAJE_ESTADO_PARTIDO } from './mensajes-partido';

// Contrato 9.10: GET /api/partidos?torneoId=&equipoId=&estado= (todos opcionales).
// En la URL todo llega como texto. Misma configuración global de main.ts.
async function validar(query: object) {
  const dto = plainToInstance(FiltrosPartidoDto, query);
  const errores = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return { dto, errores };
}

const primerMensaje = (
  errores: { property: string; constraints?: Record<string, string> }[],
  campo: string,
) =>
  Object.values(
    errores.find((e) => e.property === campo)?.constraints ?? {},
  )[0];

describe('FiltrosPartidoDto', () => {
  it('sin filtros es válido y todo queda undefined', async () => {
    const { dto, errores } = await validar({});
    expect(errores).toHaveLength(0);
    expect(dto.torneoId).toBeUndefined();
    expect(dto.equipoId).toBeUndefined();
    expect(dto.estado).toBeUndefined();
  });

  it('acepta los tres filtros juntos y convierte los ids a número', async () => {
    const { dto, errores } = await validar({
      torneoId: '1',
      equipoId: '4',
      estado: 'EN_JUEGO',
    });
    expect(errores).toHaveLength(0);
    expect(dto.torneoId).toBe(1);
    expect(dto.equipoId).toBe(4);
    expect(dto.estado).toBe('EN_JUEGO');
  });

  describe.each(['torneoId', 'equipoId'] as const)('%s', (campo) => {
    it('"abc" da error (400) con mensaje de número entero', async () => {
      const { errores } = await validar({ [campo]: 'abc' });
      expect(primerMensaje(errores, campo)).toBe(
        `${campo} debe ser un número entero`,
      );
    });

    it('vacío ("?campo=") pasa como "sin filtro" (undefined)', async () => {
      const { dto, errores } = await validar({ [campo]: '' });
      expect(errores).toHaveLength(0);
      expect(dto[campo]).toBeUndefined();
    });

    it('solo espacios también es "sin filtro"', async () => {
      const { dto, errores } = await validar({ [campo]: '   ' });
      expect(errores).toHaveLength(0);
      expect(dto[campo]).toBeUndefined();
    });

    it('recorta espacios: " 7 " pasa como 7', async () => {
      const { dto, errores } = await validar({ [campo]: ' 7 ' });
      expect(errores).toHaveLength(0);
      expect(dto[campo]).toBe(7);
    });

    it('"1" es el mínimo válido', async () => {
      const { dto, errores } = await validar({ [campo]: '1' });
      expect(errores).toHaveLength(0);
      expect(dto[campo]).toBe(1);
    });

    it.each(['0', '-3'])('"%s" da error (mayor o igual a 1)', async (valor) => {
      const { errores } = await validar({ [campo]: valor });
      expect(primerMensaje(errores, campo)).toBe(
        `${campo} debe ser mayor o igual a 1`,
      );
    });

    // Number("1e2") = 100 y Number("0x10") = 16: el transformador NO debe convertirlos.
    it.each(['1e2', '0x10', '1,5', '+5'])(
      '"%s" no se convierte en número: da error (debe ser entero)',
      async (valor) => {
        const { dto, errores } = await validar({ [campo]: valor });
        expect(dto[campo]).toBe(valor);
        expect(primerMensaje(errores, campo)).toBe(
          `${campo} debe ser un número entero`,
        );
      },
    );

    it('" 5 " (con espacios) se convierte en 5', async () => {
      const { dto, errores } = await validar({ [campo]: ' 5 ' });
      expect(errores).toHaveLength(0);
      expect(dto[campo]).toBe(5);
    });

    it('"-3" llega como número negativo y falla en @Min', async () => {
      const { dto, errores } = await validar({ [campo]: '-3' });
      expect(dto[campo]).toBe(-3);
      expect(primerMensaje(errores, campo)).toBe(
        `${campo} debe ser mayor o igual a 1`,
      );
    });

    it('repetido en la URL (?campo=1&campo=2 llega como arreglo) da error', async () => {
      const { errores } = await validar({ [campo]: ['1', '2'] });
      expect(errores.map((e) => e.property)).toContain(campo);
    });

    it('"1.5" da error (debe ser entero)', async () => {
      const { errores } = await validar({ [campo]: '1.5' });
      expect(primerMensaje(errores, campo)).toBe(
        `${campo} debe ser un número entero`,
      );
    });
  });

  describe('estado (heredado de FiltrosPartidoFaseDto)', () => {
    it.each(['PROGRAMADO', 'EN_JUEGO', 'FINALIZADO', 'CANCELADO'])(
      'acepta %s',
      async (estado) => {
        const { errores } = await validar({ estado });
        expect(errores).toHaveLength(0);
      },
    );

    it('"?estado=" vacío pasa como "sin filtro" (undefined, no null)', async () => {
      const { dto, errores } = await validar({ estado: '' });
      expect(errores).toHaveLength(0);
      expect(dto.estado).toBeUndefined();
    });

    it('un estado inválido da error (400)', async () => {
      const { errores } = await validar({ estado: 'TERMINADO' });
      expect(primerMensaje(errores, 'estado')).toBe(MENSAJE_ESTADO_PARTIDO);
    });
  });

  it('rechaza parámetros desconocidos (forbidNonWhitelisted)', async () => {
    const { errores } = await validar({ faseId: '3' });
    expect(errores.map((e) => e.property)).toContain('faseId');
  });
});
