import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CambiarEstadoPartidoDto } from './cambiar-estado-partido.dto';
import { MENSAJE_ESTADO_PARTIDO } from './mensajes-partido';

// Contrato 9.10: PATCH /api/partidos/{id}/estado con { "estado": "EN_JUEGO" }.
// Simula el ValidationPipe global: transformar (@Transform) y luego validar.
async function validar(body: object) {
  const dto = plainToInstance(CambiarEstadoPartidoDto, body);
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

describe('CambiarEstadoPartidoDto', () => {
  it.each(['PROGRAMADO', 'EN_JUEGO', 'FINALIZADO', 'CANCELADO'])(
    'acepta %s',
    async (estado) => {
      const { dto, errores } = await validar({ estado });
      expect(errores).toHaveLength(0);
      expect(dto.estado).toBe(estado);
    },
  );

  it('recorta espacios: " EN_JUEGO " pasa como EN_JUEGO', async () => {
    const { dto, errores } = await validar({ estado: ' EN_JUEGO ' });
    expect(errores).toHaveLength(0);
    expect(dto.estado).toBe('EN_JUEGO');
  });

  describe('estado obligatorio', () => {
    it.each([
      ['no viene ({})', {}],
      ['es cadena vacía', { estado: '' }],
      ['es solo espacios', { estado: '   ' }],
      ['es null', { estado: null }],
    ])('si %s, el primer mensaje es "obligatorio"', async (_caso, body) => {
      const { errores } = await validar(body);
      expect(errores.map((e) => e.property)).toContain('estado');
      expect(primerMensaje(errores, 'estado')).toBe('El estado es obligatorio');
    });
  });

  describe('solo acepta los valores del enum', () => {
    it.each(['en_juego', 'Programado', 'TERMINADO', 'EN JUEGO', 'ACTIVO'])(
      'rechaza %p con el mensaje de los 4 estados',
      async (estado) => {
        const { errores } = await validar({ estado });
        expect(primerMensaje(errores, 'estado')).toBe(MENSAJE_ESTADO_PARTIDO);
      },
    );

    it.each([1, true, {}, ['EN_JUEGO']])(
      'rechaza un valor que no es texto (%p)',
      async (estado) => {
        const { errores } = await validar({ estado });
        expect(errores.map((e) => e.property)).toContain('estado');
      },
    );
  });

  it('con forbidNonWhitelisted rechaza campos de más (por ejemplo marcadorLocal)', async () => {
    const { errores } = await validar({ estado: 'EN_JUEGO', marcadorLocal: 2 });
    expect(errores.map((e) => e.property)).toContain('marcadorLocal');
  });
});
