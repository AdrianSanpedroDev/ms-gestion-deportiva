import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ResultadoDto } from './resultado.dto';

// Contrato 9.11: body de PUT /api/partidos/{id}/resultado. Misma configuración global de main.ts.
async function validar(body: object) {
  const dto = plainToInstance(ResultadoDto, body);
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

describe('ResultadoDto', () => {
  it('acepta el body del contrato { marcadorLocal: 2, marcadorVisitante: 1 }', async () => {
    const { errores } = await validar({
      marcadorLocal: 2,
      marcadorVisitante: 1,
    });
    expect(errores).toHaveLength(0);
  });

  it('acepta un 0-0 (el cero no es "vacío")', async () => {
    const { errores } = await validar({
      marcadorLocal: 0,
      marcadorVisitante: 0,
    });
    expect(errores).toHaveLength(0);
  });

  describe('obligatorios', () => {
    it('{} falla en los dos marcadores y el primer mensaje dice "obligatorio"', async () => {
      const { errores } = await validar({});
      expect(campos(errores).sort()).toEqual([
        'marcadorLocal',
        'marcadorVisitante',
      ]);
      expect(primerMensaje(errores, 'marcadorLocal')).toMatch(/obligatorio/);
      expect(primerMensaje(errores, 'marcadorVisitante')).toMatch(
        /obligatorio/,
      );
    });

    it('falta solo marcadorVisitante: solo falla ese campo', async () => {
      const { errores } = await validar({ marcadorLocal: 2 });
      expect(campos(errores)).toEqual(['marcadorVisitante']);
      expect(primerMensaje(errores, 'marcadorVisitante')).toMatch(
        /obligatorio/,
      );
    });

    it('falta solo marcadorLocal: solo falla ese campo', async () => {
      const { errores } = await validar({ marcadorVisitante: 2 });
      expect(campos(errores)).toEqual(['marcadorLocal']);
      expect(primerMensaje(errores, 'marcadorLocal')).toMatch(/obligatorio/);
    });

    it('null cuenta como ausente: "obligatorio"', async () => {
      const { errores } = await validar({
        marcadorLocal: null,
        marcadorVisitante: null,
      });
      expect(primerMensaje(errores, 'marcadorLocal')).toMatch(/obligatorio/);
      expect(primerMensaje(errores, 'marcadorVisitante')).toMatch(
        /obligatorio/,
      );
    });
  });

  describe.each(['marcadorLocal', 'marcadorVisitante'])('%s', (campo) => {
    const otro =
      campo === 'marcadorLocal' ? 'marcadorVisitante' : 'marcadorLocal';
    const conValor = (valor: unknown) => ({ [otro]: 1, [campo]: valor });

    it('-1 falla (debe ser >= 0)', async () => {
      const { errores } = await validar(conValor(-1));
      expect(campos(errores)).toEqual([campo]);
      expect(primerMensaje(errores, campo)).toMatch(/mayor o igual a 0/);
    });

    it('1.5 falla (debe ser entero)', async () => {
      const { errores } = await validar(conValor(1.5));
      expect(campos(errores)).toEqual([campo]);
    });

    it('"2" (texto) falla: no se convierte solo', async () => {
      const { errores } = await validar(conValor('2'));
      expect(campos(errores)).toEqual([campo]);
    });

    it('0 y un valor grande pasan', async () => {
      expect((await validar(conValor(0))).errores).toHaveLength(0);
      expect((await validar(conValor(150))).errores).toHaveLength(0);
    });
  });

  it('rechaza campos de más (forbidNonWhitelisted): no se puede mandar un "estado"', async () => {
    const { errores } = await validar({
      marcadorLocal: 1,
      marcadorVisitante: 0,
      estado: 'FINALIZADO',
    });
    expect(campos(errores)).toEqual(['estado']);
  });
});
