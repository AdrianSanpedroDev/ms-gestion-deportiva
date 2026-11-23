import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ActualizarPartidoDto } from './actualizar-partido.dto';
import { CrearPartidoDto } from './crear-partido.dto';

// Contrato 9.10: PartidoRequest. Misma configuración global de main.ts.
async function validar(body: object, clase = CrearPartidoDto) {
  const dto = plainToInstance(clase, body);
  const errores = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return { dto, errores };
}

// Rondas según ACUERDOS (tabla de enums: TERCER_PUESTO va antes de FINAL). El DTO arma su mensaje con
// Object.values(RondaFinal).join(', '), así que el orden del mensaje es el del enum real.
const RONDAS = [
  'DIECISEISAVOS',
  'OCTAVOS',
  'CUARTOS',
  'SEMIFINAL',
  'TERCER_PUESTO',
  'FINAL',
];
const MENSAJE_RONDA = `La ronda debe ser uno de estos valores: ${RONDAS.join(', ')}`;

const valido = {
  equipoLocalId: 4,
  equipoVisitanteId: 9,
  fechaHora: '2026-12-05T15:30:00',
  escenarioId: 1,
  ronda: null,
  numeroLlave: null,
};

type Errores = { property: string; constraints?: Record<string, string> }[];
const campos = (errores: Errores) => errores.map((e) => e.property);
const mensajes = (errores: Errores, campo: string) =>
  Object.values(errores.find((e) => e.property === campo)?.constraints ?? {});
const primerMensaje = (errores: Errores, campo: string) =>
  mensajes(errores, campo)[0];

describe('CrearPartidoDto', () => {
  it('acepta el PartidoRequest del contrato (9.10)', async () => {
    const { errores } = await validar(valido);
    expect(errores).toHaveLength(0);
  });

  it('acepta un body mínimo (sin escenarioId, ronda ni numeroLlave)', async () => {
    const { errores } = await validar({
      equipoLocalId: 4,
      equipoVisitanteId: 9,
      fechaHora: '2026-12-05T15:30:00',
    });
    expect(errores).toHaveLength(0);
  });

  describe('campos obligatorios: {} da el mensaje "obligatorio"', () => {
    it('equipoLocalId, equipoVisitanteId y fechaHora fallan con su mensaje de obligatorio', async () => {
      const { errores } = await validar({});
      expect(primerMensaje(errores, 'equipoLocalId')).toBe(
        'El equipo local es obligatorio',
      );
      expect(primerMensaje(errores, 'equipoVisitanteId')).toBe(
        'El equipo visitante es obligatorio',
      );
      expect(primerMensaje(errores, 'fechaHora')).toBe(
        'La fecha y hora es obligatoria',
      );
    });

    it('los campos opcionales NO fallan con {}', async () => {
      const { errores } = await validar({});
      expect(campos(errores).sort()).toEqual(
        ['equipoLocalId', 'equipoVisitanteId', 'fechaHora'].sort(),
      );
    });

    it('null en un id obligatorio también da "obligatorio"', async () => {
      const { errores } = await validar({ ...valido, equipoLocalId: null });
      expect(primerMensaje(errores, 'equipoLocalId')).toBe(
        'El equipo local es obligatorio',
      );
    });

    it('null en equipoVisitanteId da "obligatorio"', async () => {
      const { errores } = await validar({ ...valido, equipoVisitanteId: null });
      expect(primerMensaje(errores, 'equipoVisitanteId')).toBe(
        'El equipo visitante es obligatorio',
      );
    });

    it('null en fechaHora da "obligatoria"', async () => {
      const { errores } = await validar({ ...valido, fechaHora: null });
      expect(primerMensaje(errores, 'fechaHora')).toBe(
        'La fecha y hora es obligatoria',
      );
    });

    it('fechaHora vacía o solo espacios da "obligatoria"', async () => {
      for (const fechaHora of ['', '   ']) {
        const { errores } = await validar({ ...valido, fechaHora });
        expect(primerMensaje(errores, 'fechaHora')).toBe(
          'La fecha y hora es obligatoria',
        );
      }
    });
  });

  describe.each([
    ['equipoLocalId', 'equipo local'],
    ['equipoVisitanteId', 'equipo visitante'],
  ] as const)('%s (id entero positivo)', (campo, nombre) => {
    it('1 es el mínimo válido', async () => {
      const { errores } = await validar({ ...valido, [campo]: 1 });
      expect(errores).toHaveLength(0);
    });

    it.each([0, -1])('%i da error "mayor o igual a 1"', async (valor) => {
      const { errores } = await validar({ ...valido, [campo]: valor });
      expect(primerMensaje(errores, campo)).toBe(
        `El id del ${nombre} debe ser mayor o igual a 1`,
      );
    });

    it('1.5 da error "número entero"', async () => {
      const { errores } = await validar({ ...valido, [campo]: 1.5 });
      expect(primerMensaje(errores, campo)).toBe(
        `El id del ${nombre} debe ser un número entero`,
      );
    });

    it('un texto ("4") no es un número: da error "número entero"', async () => {
      const { errores } = await validar({ ...valido, [campo]: '4' });
      expect(primerMensaje(errores, campo)).toBe(
        `El id del ${nombre} debe ser un número entero`,
      );
    });
  });

  describe('fechaHora (formato yyyy-MM-ddTHH:mm:ss)', () => {
    it('acepta "2026-12-05T15:30:00"', async () => {
      const { errores } = await validar({ ...valido });
      expect(errores).toHaveLength(0);
    });

    it('recorta espacios al inicio y al final', async () => {
      const { dto, errores } = await validar({
        ...valido,
        fechaHora: '  2026-12-05T15:30:00 ',
      });
      expect(errores).toHaveLength(0);
      expect(dto.fechaHora).toBe('2026-12-05T15:30:00');
    });

    it.each([
      '2026-12-05 15:30:00', // espacio en vez de T
      '2026-12-05', // sin hora
      '2026-12-05T15:30', // sin segundos
      '2026-12-05T15:30:00Z', // con zona
      '2026-12-05T15:30:00.000', // con milisegundos
      '05/12/2026 15:30',
      'mañana',
    ])('rechaza %p con mensaje de formato', async (fechaHora) => {
      const { errores } = await validar({ ...valido, fechaHora });
      expect(campos(errores)).toContain('fechaHora');
      expect(mensajes(errores, 'fechaHora')).toContain(
        'La fecha y hora debe tener formato yyyy-MM-ddTHH:mm:ss',
      );
    });

    it.each([
      '2026-02-30T10:00:00', // 30 de febrero
      '2027-02-29T10:00:00', // 2027 no es bisiesto
      '2026-13-01T10:00:00', // mes 13
      '2026-12-05T25:00:00', // hora imposible
      '2026-12-05T15:60:00', // minuto 60
    ])(
      'rechaza la fecha inexistente %p con el mensaje "no es una fecha válida"',
      async (fechaHora) => {
        const { errores } = await validar({ ...valido, fechaHora });
        expect(campos(errores)).toContain('fechaHora');
        expect(mensajes(errores, 'fechaHora')).toContain(
          'La fecha y hora no es una fecha válida',
        );
      },
    );

    it.each([
      '2028-02-29T10:00:00', // 29-feb de año bisiesto existe
      '2026-12-05T23:59:59', // último segundo del día
      '2026-12-05T00:00:00', // medianoche
    ])('acepta el borde válido %p', async (fechaHora) => {
      const { dto, errores } = await validar({ ...valido, fechaHora });
      expect(errores).toHaveLength(0);
      expect(dto.fechaHora).toBe(fechaHora);
    });

    it('rechaza un valor que no es texto', async () => {
      const { errores } = await validar({ ...valido, fechaHora: 20261205 });
      expect(campos(errores)).toContain('fechaHora');
    });
  });

  describe('escenarioId (opcional)', () => {
    it.each([undefined, null, 1, 25])('acepta %p', async (escenarioId) => {
      const { errores } = await validar({ ...valido, escenarioId });
      expect(errores).toHaveLength(0);
    });

    it.each([0, -2])('rechaza %i (mayor o igual a 1)', async (escenarioId) => {
      const { errores } = await validar({ ...valido, escenarioId });
      expect(primerMensaje(errores, 'escenarioId')).toBe(
        'El id del escenario debe ser mayor o igual a 1',
      );
    });

    it('rechaza un texto ("1"): el body JSON trae números, no se convierte', async () => {
      const { errores } = await validar({ ...valido, escenarioId: '1' });
      expect(primerMensaje(errores, 'escenarioId')).toBe(
        'El id del escenario debe ser un número entero',
      );
    });

    it('rechaza 1.5 (número entero)', async () => {
      const { errores } = await validar({ ...valido, escenarioId: 1.5 });
      expect(primerMensaje(errores, 'escenarioId')).toBe(
        'El id del escenario debe ser un número entero',
      );
    });
  });

  describe('ronda (opcional; si es obligatoria lo decide el service según la fase)', () => {
    it.each([
      'DIECISEISAVOS',
      'OCTAVOS',
      'CUARTOS',
      'SEMIFINAL',
      'FINAL',
      'TERCER_PUESTO',
    ])('acepta %s', async (ronda) => {
      const { errores } = await validar({ ...valido, ronda });
      expect(errores).toHaveLength(0);
    });

    it('acepta null y ausente (fase de grupos)', async () => {
      expect((await validar({ ...valido, ronda: null })).errores).toHaveLength(
        0,
      );
      const { ronda, ...sinRonda } = valido;
      void ronda;
      expect((await validar(sinRonda)).errores).toHaveLength(0);
    });

    it('"" y solo espacios se vuelven null y pasan', async () => {
      for (const ronda of ['', '   ']) {
        const { dto, errores } = await validar({ ...valido, ronda });
        expect(errores).toHaveLength(0);
        expect(dto.ronda).toBeNull();
      }
    });

    it('recorta espacios: " CUARTOS " pasa como CUARTOS', async () => {
      const { dto, errores } = await validar({ ...valido, ronda: ' CUARTOS ' });
      expect(errores).toHaveLength(0);
      expect(dto.ronda).toBe('CUARTOS');
    });

    it.each(['cuartos', 'PRIMERA', 'FASE_FINAL'])(
      'rechaza %p con el mensaje de las rondas válidas',
      async (ronda) => {
        const { errores } = await validar({ ...valido, ronda });
        expect(primerMensaje(errores, 'ronda')).toBe(MENSAJE_RONDA);
      },
    );
  });

  describe('numeroLlave (opcional; el rango lo valida el service)', () => {
    it.each([undefined, null, 1, 16])('acepta %p', async (numeroLlave) => {
      const { errores } = await validar({ ...valido, numeroLlave });
      expect(errores).toHaveLength(0);
    });

    it.each([0, -1])('rechaza %i (mayor o igual a 1)', async (numeroLlave) => {
      const { errores } = await validar({ ...valido, numeroLlave });
      expect(primerMensaje(errores, 'numeroLlave')).toBe(
        'El número de llave debe ser mayor o igual a 1',
      );
    });

    it('rechaza 1.5 (número entero)', async () => {
      const { errores } = await validar({ ...valido, numeroLlave: 1.5 });
      expect(primerMensaje(errores, 'numeroLlave')).toBe(
        'El número de llave debe ser un número entero',
      );
    });

    it('rechaza un texto ("2")', async () => {
      const { errores } = await validar({ ...valido, numeroLlave: '2' });
      expect(campos(errores)).toContain('numeroLlave');
    });
  });

  it('forbidNonWhitelisted rechaza campos que no son del PartidoRequest (faseId viene en la URL)', async () => {
    const { errores } = await validar({ ...valido, faseId: 3 });
    expect(campos(errores)).toContain('faseId');
  });

  it('forbidNonWhitelisted rechaza estado y marcadores en el body (no se editan por aquí)', async () => {
    const { errores } = await validar({
      ...valido,
      estado: 'FINALIZADO',
      marcadorLocal: 3,
    });
    expect(campos(errores)).toEqual(
      expect.arrayContaining(['estado', 'marcadorLocal']),
    );
  });
});

describe('ActualizarPartidoDto (PUT = mismo PartidoRequest)', () => {
  it('acepta el body completo', async () => {
    const { errores } = await validar(valido, ActualizarPartidoDto);
    expect(errores).toHaveLength(0);
  });

  it('{} sigue exigiendo los campos obligatorios (PUT reemplaza todo, no es parcial)', async () => {
    const { errores } = await validar({}, ActualizarPartidoDto);
    expect(campos(errores).sort()).toEqual(
      ['equipoLocalId', 'equipoVisitanteId', 'fechaHora'].sort(),
    );
  });
});
