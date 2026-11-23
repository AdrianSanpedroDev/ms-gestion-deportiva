import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ActualizarFaseDto } from './actualizar-fase.dto';

async function validar(plano: Record<string, unknown>) {
  const dto = plainToInstance(ActualizarFaseDto, plano);
  const errores = await validate(dto);
  return { dto, errores };
}

describe('ActualizarFaseDto', () => {
  it('acepta nombre y orden válidos y aplica trim al nombre', async () => {
    const { dto, errores } = await validar({
      nombre: '  Grupo A  ',
      orden: 1,
    });

    expect(errores).toHaveLength(0);
    expect(dto.nombre).toBe('Grupo A');
    expect(dto.orden).toBe(1);
  });

  it('acepta actualización parcial solo con nombre o solo con orden', async () => {
    const soloNombre = await validar({ nombre: 'Grupo B' });
    const soloOrden = await validar({ orden: 2 });

    expect(soloNombre.errores).toHaveLength(0);
    expect(soloOrden.errores).toHaveLength(0);
  });

  it('rechaza nombre vacío o solo espacios', async () => {
    const { errores } = await validar({ nombre: '   ' });

    expect(errores).toHaveLength(1);
    expect(errores[0].property).toBe('nombre');
    expect(errores[0].constraints?.isNotEmpty).toBe(
      'El nombre de la fase no puede estar vacío',
    );
  });

  it('rechaza nombre que supere 100 caracteres', async () => {
    const { errores } = await validar({ nombre: 'A'.repeat(101) });

    expect(errores).toHaveLength(1);
    expect(errores[0].property).toBe('nombre');
    expect(errores[0].constraints?.maxLength).toBeDefined();
  });

  it('rechaza orden menor a 1 o no entero', async () => {
    const cero = await validar({ orden: 0 });
    const decimal = await validar({ orden: 1.5 });

    expect(cero.errores).toHaveLength(1);
    expect(cero.errores[0].constraints?.min).toBe(
      'El orden de la fase debe ser mayor o igual a 1',
    );
    expect(decimal.errores).toHaveLength(1);
    expect(decimal.errores[0].constraints?.isInt).toBe(
      'El orden de la fase debe ser un número entero',
    );
  });
});
