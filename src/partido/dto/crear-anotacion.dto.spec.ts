import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ActualizarAnotacionDto } from './actualizar-anotacion.dto';
import { CrearAnotacionDto } from './crear-anotacion.dto';

// Contrato 9.11: AnotacionRequest { jugadorId, minuto, valor, descripcion }. Misma configuración global de main.ts.
async function validar(body: object, clase = CrearAnotacionDto) {
  const dto = plainToInstance(clase, body);
  const errores = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return { dto, errores };
}

type Errores = { property: string; constraints?: Record<string, string> }[];
const campos = (errores: Errores) => errores.map((e) => e.property);
const mensajes = (errores: Errores, campo: string) =>
  Object.values(errores.find((e) => e.property === campo)?.constraints ?? {});
const primerMensaje = (errores: Errores, campo: string) =>
  mensajes(errores, campo)[0];

const valido = {
  jugadorId: 7,
  minuto: 34,
  valor: 1,
  descripcion: 'Gol de cabeza',
};

describe('CrearAnotacionDto', () => {
  it('acepta el AnotacionRequest del contrato (9.11)', async () => {
    const { errores } = await validar(valido);
    expect(errores).toHaveLength(0);
  });

  it('acepta solo jugadorId (minuto, valor y descripcion son opcionales)', async () => {
    const { errores } = await validar({ jugadorId: 7 });
    expect(errores).toHaveLength(0);
  });

  describe('jugadorId', () => {
    it('{} falla en jugadorId con mensaje "obligatorio"', async () => {
      const { errores } = await validar({});
      expect(campos(errores)).toEqual(['jugadorId']);
      expect(primerMensaje(errores, 'jugadorId')).toMatch(/obligatorio/);
    });

    it('null falla con "obligatorio"', async () => {
      const { errores } = await validar({ jugadorId: null });
      expect(primerMensaje(errores, 'jugadorId')).toMatch(/obligatorio/);
    });

    it('0 falla (debe ser >= 1)', async () => {
      const { errores } = await validar({ jugadorId: 0 });
      expect(campos(errores)).toEqual(['jugadorId']);
      expect(primerMensaje(errores, 'jugadorId')).toMatch(/mayor o igual a 1/);
    });

    it('-3 falla', async () => {
      const { errores } = await validar({ jugadorId: -3 });
      expect(campos(errores)).toEqual(['jugadorId']);
    });

    it('1.5 falla (debe ser entero)', async () => {
      const { errores } = await validar({ jugadorId: 1.5 });
      expect(campos(errores)).toEqual(['jugadorId']);
    });

    it('"7" (texto) falla', async () => {
      const { errores } = await validar({ jugadorId: '7' });
      expect(campos(errores)).toEqual(['jugadorId']);
    });

    it('1 pasa (borde inferior)', async () => {
      const { errores } = await validar({ jugadorId: 1 });
      expect(errores).toHaveLength(0);
    });
  });

  describe('minuto (opcional, >= 0)', () => {
    it('0 pasa (borde: >= y no >)', async () => {
      const { errores } = await validar({ jugadorId: 7, minuto: 0 });
      expect(errores).toHaveLength(0);
    });

    it('null pasa (anotación sin minuto registrado)', async () => {
      const { errores } = await validar({ jugadorId: 7, minuto: null });
      expect(errores).toHaveLength(0);
    });

    it('-1 falla', async () => {
      const { errores } = await validar({ jugadorId: 7, minuto: -1 });
      expect(campos(errores)).toEqual(['minuto']);
      expect(primerMensaje(errores, 'minuto')).toMatch(/mayor o igual a 0/);
    });

    it('1.5 falla', async () => {
      const { errores } = await validar({ jugadorId: 7, minuto: 1.5 });
      expect(campos(errores)).toEqual(['minuto']);
    });

    it('"34" (texto) falla', async () => {
      const { errores } = await validar({ jugadorId: 7, minuto: '34' });
      expect(campos(errores)).toEqual(['minuto']);
    });
  });

  describe('valor (opcional, >= 1)', () => {
    it('ausente pasa (el default 1 lo pone el mapper)', async () => {
      const { errores } = await validar({ jugadorId: 7 });
      expect(campos(errores)).not.toContain('valor');
    });

    it('1 pasa y 3 pasa (un triple)', async () => {
      expect((await validar({ jugadorId: 7, valor: 1 })).errores).toHaveLength(
        0,
      );
      expect((await validar({ jugadorId: 7, valor: 3 })).errores).toHaveLength(
        0,
      );
    });

    it('0 falla (el valor mínimo es 1)', async () => {
      const { errores } = await validar({ jugadorId: 7, valor: 0 });
      expect(campos(errores)).toEqual(['valor']);
      expect(primerMensaje(errores, 'valor')).toMatch(/mayor o igual a 1/);
    });

    it('-1 falla', async () => {
      const { errores } = await validar({ jugadorId: 7, valor: -1 });
      expect(campos(errores)).toEqual(['valor']);
    });

    it('2.5 falla', async () => {
      const { errores } = await validar({ jugadorId: 7, valor: 2.5 });
      expect(campos(errores)).toEqual(['valor']);
    });

    it('"1" (texto) falla', async () => {
      const { errores } = await validar({ jugadorId: 7, valor: '1' });
      expect(campos(errores)).toEqual(['valor']);
    });
  });

  describe('descripcion (opcional, máximo 255)', () => {
    it('255 caracteres pasa (borde)', async () => {
      const { errores } = await validar({
        jugadorId: 7,
        descripcion: 'a'.repeat(255),
      });
      expect(errores).toHaveLength(0);
    });

    it('256 caracteres falla', async () => {
      const { errores } = await validar({
        jugadorId: 7,
        descripcion: 'a'.repeat(256),
      });
      expect(campos(errores)).toEqual(['descripcion']);
      expect(primerMensaje(errores, 'descripcion')).toMatch(/255/);
    });

    it('se recorta (trim): "  Gol de cabeza  " queda "Gol de cabeza"', async () => {
      const { dto, errores } = await validar({
        jugadorId: 7,
        descripcion: '  Gol de cabeza  ',
      });
      expect(errores).toHaveLength(0);
      expect(dto.descripcion).toBe('Gol de cabeza');
    });

    it('255 letras con espacios alrededor pasan: el trim va ANTES de medir', async () => {
      const { dto, errores } = await validar({
        jugadorId: 7,
        descripcion: `  ${'a'.repeat(255)}  `,
      });
      expect(errores).toHaveLength(0);
      expect(dto.descripcion).toHaveLength(255);
    });

    it('"  " (solo espacios) queda en null', async () => {
      const { dto, errores } = await validar({
        jugadorId: 7,
        descripcion: '  ',
      });
      expect(errores).toHaveLength(0);
      expect(dto.descripcion).toBeNull();
    });

    it('"" queda en null', async () => {
      const { dto, errores } = await validar({ jugadorId: 7, descripcion: '' });
      expect(errores).toHaveLength(0);
      expect(dto.descripcion).toBeNull();
    });

    it('un número falla (debe ser texto)', async () => {
      const { errores } = await validar({ jugadorId: 7, descripcion: 123 });
      expect(campos(errores)).toEqual(['descripcion']);
    });
  });

  it('rechaza campos de más (forbidNonWhitelisted): no se puede mandar "equipoId" ni "partidoId"', async () => {
    const { errores } = await validar({
      ...valido,
      equipoId: 4,
      partidoId: 20,
    });
    expect(campos(errores).sort()).toEqual(['equipoId', 'partidoId']);
  });
});

describe('ActualizarAnotacionDto (PUT = mismo AnotacionRequest)', () => {
  it('acepta el mismo body del contrato', async () => {
    const { errores } = await validar(valido, ActualizarAnotacionDto);
    expect(errores).toHaveLength(0);
  });

  it('{} sigue exigiendo jugadorId (PUT no es parcial)', async () => {
    const { errores } = await validar({}, ActualizarAnotacionDto);
    expect(campos(errores)).toEqual(['jugadorId']);
    expect(primerMensaje(errores, 'jugadorId')).toMatch(/obligatorio/);
  });
});
