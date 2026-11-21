import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CrearContratoDto } from './crear-contrato.dto';

// Simula lo que hace el ValidationPipe global: transformar y luego validar.
async function validar(body: object) {
  const dto = plainToInstance(CrearContratoDto, body);
  const errores = await validate(dto);
  return { dto, errores };
}

const campos = (errores: { property: string }[]) =>
  errores.map((e) => e.property);

const valido = {
  jugadorId: 7,
  fechaInicio: '2026-01-01',
  fechaFin: '2027-12-31',
};

describe('CrearContratoDto', () => {
  it('acepta un body válido (ContratoRequest 9.8)', async () => {
    const { errores } = await validar(valido);
    expect(errores).toHaveLength(0);
  });

  it('rechaza si falta jugadorId, con mensaje de "obligatorio"', async () => {
    const { errores } = await validar({ ...valido, jugadorId: undefined });
    expect(campos(errores)).toContain('jugadorId');
    const mensajes = errores.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(mensajes).toContain('El jugador es obligatorio');
  });

  it.each([0, -1, 1.5])(
    'rechaza jugadorId %p (debe ser entero >= 1)',
    async (id) => {
      const { errores } = await validar({ ...valido, jugadorId: id });
      expect(campos(errores)).toContain('jugadorId');
    },
  );

  it('rechaza si falta fechaInicio', async () => {
    const { errores } = await validar({ ...valido, fechaInicio: undefined });
    const mensajes = errores.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(campos(errores)).toContain('fechaInicio');
    expect(mensajes).toContain('La fecha de inicio es obligatoria');
  });

  it('rechaza si falta fechaFin', async () => {
    const { errores } = await validar({ ...valido, fechaFin: undefined });
    const mensajes = errores.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(campos(errores)).toContain('fechaFin');
    expect(mensajes).toContain('La fecha de fin es obligatoria');
  });

  it.each(['01-01-2026', '2026/01/01', '2026-1-1', 'mañana'])(
    'rechaza fechaInicio con formato %p',
    async (f) => {
      const { errores } = await validar({ ...valido, fechaInicio: f });
      expect(campos(errores)).toContain('fechaInicio');
    },
  );

  it.each(['2026-01-01T10:00:00', '2026-02-30', '2026-13-01'])(
    'rechaza fechaFin con hora o imposible: %p',
    async (f) => {
      const { errores } = await validar({ ...valido, fechaFin: f });
      expect(campos(errores)).toContain('fechaFin');
    },
  );

  it('rechaza fechas vacías', async () => {
    const { errores } = await validar({
      ...valido,
      fechaInicio: '',
      fechaFin: '',
    });
    expect(campos(errores)).toEqual(
      expect.arrayContaining(['fechaInicio', 'fechaFin']),
    );
  });
});
