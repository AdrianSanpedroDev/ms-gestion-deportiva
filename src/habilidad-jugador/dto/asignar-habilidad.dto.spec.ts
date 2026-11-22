import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AsignarHabilidadDto } from './asignar-habilidad.dto';

async function validar(body: object) {
  const dto = plainToInstance(AsignarHabilidadDto, body);
  const errores = await validate(dto);
  return { dto, errores };
}

const campos = (errores: { property: string }[]) =>
  errores.map((e) => e.property);

describe('AsignarHabilidadDto', () => {
  it('acepta un body válido (ACUERDOS 9.12)', async () => {
    const { errores } = await validar({ habilidadId: 2 });
    expect(errores).toHaveLength(0);
  });

  it('rechaza si falta habilidadId con mensaje de obligatorio', async () => {
    const { errores } = await validar({});
    expect(campos(errores)).toContain('habilidadId');
    const mensajes = errores.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(mensajes).toContain('La habilidad es obligatoria');
  });

  it('rechaza habilidadId null', async () => {
    const { errores } = await validar({ habilidadId: null });
    expect(campos(errores)).toContain('habilidadId');
  });

  it.each([0, -1, 1.5, '2'])(
    'rechaza habilidadId %p (debe ser entero >= 1)',
    async (id) => {
      const { errores } = await validar({ habilidadId: id });
      expect(campos(errores)).toContain('habilidadId');
    },
  );
});
