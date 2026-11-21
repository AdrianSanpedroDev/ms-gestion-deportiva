import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FiltrosContratoDto } from './filtros-contrato.dto';

// Simula el ValidationPipe con transform: en la URL todo llega como texto.
async function validar(query: object) {
  const dto = plainToInstance(FiltrosContratoDto, query);
  const errores = await validate(dto);
  return { dto, errores };
}

describe('FiltrosContratoDto', () => {
  it('sin incluirHistorial es válido y queda undefined (el service devuelve solo activos)', async () => {
    const { dto, errores } = await validar({});
    expect(errores).toHaveLength(0);
    expect(dto.incluirHistorial).toBeUndefined();
  });

  it('"true" (texto de la URL) se convierte en true', async () => {
    const { dto, errores } = await validar({ incluirHistorial: 'true' });
    expect(errores).toHaveLength(0);
    expect(dto.incluirHistorial).toBe(true);
  });

  it('"false" (texto de la URL) se convierte en false, no se ignora', async () => {
    const { dto, errores } = await validar({ incluirHistorial: 'false' });
    expect(errores).toHaveLength(0);
    expect(dto.incluirHistorial).toBe(false);
  });

  it('"?incluirHistorial=" vacío es válido y queda undefined (sin filtro)', async () => {
    const { dto, errores } = await validar({ incluirHistorial: '' });
    expect(errores).toHaveLength(0);
    expect(dto.incluirHistorial).toBeUndefined();
  });

  it.each(['abc', 'TRUE', '1', 'si'])(
    'rechaza incluirHistorial=%p con mensaje en español',
    async (valor) => {
      const { errores } = await validar({ incluirHistorial: valor });
      expect(errores.map((e) => e.property)).toContain('incluirHistorial');
      const mensajes = errores.flatMap((e) =>
        Object.values(e.constraints ?? {}),
      );
      expect(mensajes).toContain('incluirHistorial debe ser true o false');
    },
  );
});
