import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FiltrosPartidoFaseDto } from './filtros-partido-fase.dto';
import { MENSAJE_ESTADO_PARTIDO } from './mensajes-partido';

// Contrato 9.10: GET /api/fases/{faseId}/partidos?estado= (la fase va en la URL; torneoId NO aplica aquí).
// Se usa la misma configuración global de main.ts: whitelist + forbidNonWhitelisted + transform.
async function validar(query: object) {
  const dto = plainToInstance(FiltrosPartidoFaseDto, query);
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

describe('FiltrosPartidoFaseDto', () => {
  it('sin filtros es válido (devuelve todos los partidos de la fase)', async () => {
    const { dto, errores } = await validar({});
    expect(errores).toHaveLength(0);
    expect(dto.estado).toBeUndefined();
  });

  it.each(['PROGRAMADO', 'EN_JUEGO', 'FINALIZADO', 'CANCELADO'])(
    'acepta estado=%s',
    async (estado) => {
      const { dto, errores } = await validar({ estado });
      expect(errores).toHaveLength(0);
      expect(dto.estado).toBe(estado);
    },
  );

  it('"?estado=" vacío pasa como "sin filtro" (undefined, no null)', async () => {
    const { dto, errores } = await validar({ estado: '' });
    expect(errores).toHaveLength(0);
    expect(dto.estado).toBeUndefined();
  });

  it('"?estado=   " (solo espacios) también es "sin filtro" (undefined)', async () => {
    const { dto, errores } = await validar({ estado: '   ' });
    expect(errores).toHaveLength(0);
    expect(dto.estado).toBeUndefined();
  });

  it('recorta espacios: " EN_JUEGO " pasa como EN_JUEGO', async () => {
    const { dto, errores } = await validar({ estado: ' EN_JUEGO ' });
    expect(errores).toHaveLength(0);
    expect(dto.estado).toBe('EN_JUEGO');
  });

  it.each(['en_juego', 'TERMINADO', 'abc'])(
    'estado=%s inválido da error con el mensaje de los 4 estados (400)',
    async (estado) => {
      const { errores } = await validar({ estado });
      expect(primerMensaje(errores, 'estado')).toBe(MENSAJE_ESTADO_PARTIDO);
    },
  );

  describe('torneoId no está permitido en esta ruta (9.10: la fase ya viene en la URL)', () => {
    it('?torneoId=5 es rechazado por forbidNonWhitelisted', async () => {
      const { errores } = await validar({ torneoId: '5' });
      expect(errores.map((e) => e.property)).toContain('torneoId');
      expect(errores[0].constraints).toHaveProperty('whitelistValidation');
    });

    it('?equipoId=5 también es rechazado', async () => {
      const { errores } = await validar({ equipoId: '5' });
      expect(errores.map((e) => e.property)).toContain('equipoId');
    });
  });
});
