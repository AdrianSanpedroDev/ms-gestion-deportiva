import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CrearJugadorDto } from './crear-jugador.dto';

// Simula lo que hace el ValidationPipe global: transformar (con @Transform) y luego validar.
async function validar(body: object) {
  const dto = plainToInstance(CrearJugadorDto, body);
  const errores = await validate(dto);
  return { dto, errores };
}

const valido = {
  tipoDocumento: 'CC',
  numeroDocumento: '1053000000',
  nombres: 'Juan',
  apellidos: 'Pérez',
  fechaNacimiento: '2002-05-10',
};

describe('CrearJugadorDto', () => {
  it('acepta un body válido sin email ni teléfono', async () => {
    const { errores } = await validar(valido);
    expect(errores).toHaveLength(0);
  });

  it('recorta espacios en los textos obligatorios', async () => {
    const { dto, errores } = await validar({ ...valido, nombres: '  Juan  ' });
    expect(errores).toHaveLength(0);
    expect(dto.nombres).toBe('Juan');
  });

  it('rechaza nombres de solo espacios', async () => {
    const { errores } = await validar({ ...valido, nombres: '   ' });
    expect(errores.map((e) => e.property)).toContain('nombres');
  });

  it('email o teléfono vacíos ("" o espacios) se vuelven null y no dan error', async () => {
    const { dto, errores } = await validar({
      ...valido,
      email: '',
      telefono: '   ',
    });
    expect(errores).toHaveLength(0);
    expect(dto.email).toBeNull();
    expect(dto.telefono).toBeNull();
  });

  it('rechaza un email con formato inválido', async () => {
    const { errores } = await validar({ ...valido, email: 'no-es-correo' });
    expect(errores.map((e) => e.property)).toContain('email');
  });

  it('sin tipoDocumento ni fechaNacimiento da el mensaje de "obligatorio"', async () => {
    const { errores } = await validar({
      ...valido,
      tipoDocumento: undefined,
      fechaNacimiento: undefined,
    });
    const mensajes = errores.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(mensajes).toContain('El tipo de documento es obligatorio');
    expect(mensajes).toContain('La fecha de nacimiento es obligatoria');
  });

  it('rechaza fechas con hora o imposibles', async () => {
    expect(
      (await validar({ ...valido, fechaNacimiento: '2002-05-10T10:00:00' }))
        .errores,
    ).not.toHaveLength(0);
    expect(
      (await validar({ ...valido, fechaNacimiento: '2002-02-30' })).errores,
    ).not.toHaveLength(0);
  });
});
