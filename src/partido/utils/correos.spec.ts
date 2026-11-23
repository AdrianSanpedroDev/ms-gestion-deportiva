import type { Logger } from '@nestjs/common';
import type { CorreoService } from '../../common/notificacion/correo.service';
import { enviarEnSegundoPlano, escaparHtml, textoMinuto } from './correos';

// Contrato: ACUERDOS 8 (correos de partidos: el cuerpo HTML escapa lo que viene de la BD,
// los correos no bloquean la respuesta y un fallo de correo solo se registra en el log).

// Deja correr las promesas pendientes (el envío va en segundo plano).
const vaciarPromesas = () => new Promise<void>((r) => setImmediate(r));

describe('escaparHtml', () => {
  it.each([
    ['&', '&amp;'],
    ['<', '&lt;'],
    ['>', '&gt;'],
    ['"', '&quot;'],
    ["'", '&#39;'],
  ])('escapa %s como %s', (entrada, esperado) => {
    expect(escaparHtml(entrada)).toBe(esperado);
  });

  it('escapa los 5 caracteres juntos', () => {
    expect(escaparHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });

  it('un nombre con etiqueta no queda como etiqueta', () => {
    expect(escaparHtml('Tigres <FC>')).toBe('Tigres &lt;FC&gt;');
  });

  it('escapa el & primero: no vuelve a escapar el & de las otras entidades', () => {
    expect(escaparHtml('<')).toBe('&lt;');
    expect(escaparHtml('<')).not.toContain('&amp;lt;');
  });

  it('escapa todas las apariciones, no solo la primera', () => {
    expect(escaparHtml('a<b<c')).toBe('a&lt;b&lt;c');
  });

  it('un texto normal queda igual (tildes y espacios incluidos)', () => {
    expect(escaparHtml('Once Caldas vs Atlético Nacional')).toBe(
      'Once Caldas vs Atlético Nacional',
    );
  });

  it('un texto vacío queda vacío', () => {
    expect(escaparHtml('')).toBe('');
  });
});

describe('textoMinuto', () => {
  it('null → "sin minuto"', () => {
    expect(textoMinuto(null)).toBe('sin minuto');
  });

  it('0 → "minuto 0" (el 0 es un minuto válido, no es "sin minuto")', () => {
    expect(textoMinuto(0)).toBe('minuto 0');
  });

  it('34 → "minuto 34"', () => {
    expect(textoMinuto(34)).toBe('minuto 34');
  });
});

describe('enviarEnSegundoPlano', () => {
  let correoService: { enviar: jest.Mock };
  let logger: { error: jest.Mock };

  const ejecutar = (destinatarios: Promise<string[]>) =>
    enviarEnSegundoPlano(
      destinatarios,
      'Asunto',
      '<p>Cuerpo</p>',
      correoService as unknown as CorreoService,
      logger as unknown as Logger,
      'el correo de prueba',
    );

  beforeEach(() => {
    correoService = { enviar: jest.fn() };
    logger = { error: jest.fn() };
  });

  it('devuelve void de inmediato (no devuelve la promesa para que nadie la espere)', () => {
    const r = ejecutar(Promise.resolve(['a@gmail.com']));
    expect(r).toBeUndefined();
  });

  it('cuando llegan los destinatarios, envía con ellos, el asunto y el html', async () => {
    ejecutar(Promise.resolve(['a@gmail.com', 'b@gmail.com']));
    await vaciarPromesas();
    expect(correoService.enviar).toHaveBeenCalledTimes(1);
    expect(correoService.enviar).toHaveBeenCalledWith(
      ['a@gmail.com', 'b@gmail.com'],
      'Asunto',
      '<p>Cuerpo</p>',
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('no envía antes de que los destinatarios respondan', async () => {
    let resolver: (lista: string[]) => void = () => undefined;
    ejecutar(new Promise<string[]>((r) => (resolver = r)));
    await vaciarPromesas();
    expect(correoService.enviar).not.toHaveBeenCalled();

    resolver(['a@gmail.com']);
    await vaciarPromesas();
    expect(correoService.enviar).toHaveBeenCalledTimes(1);
  });

  it('si los destinatarios rechazan, no lanza, no envía y registra en el logger', async () => {
    expect(() =>
      ejecutar(Promise.reject(new Error('falló la consulta'))),
    ).not.toThrow();
    await vaciarPromesas();
    expect(correoService.enviar).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('el correo de prueba'),
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('falló la consulta'),
    );
  });

  it('si enviar lanza error (síncrono), no se propaga y se registra en el logger', async () => {
    correoService.enviar.mockImplementation(() => {
      throw new Error('ms-notifications caído');
    });
    expect(() => ejecutar(Promise.resolve(['a@gmail.com']))).not.toThrow();
    await vaciarPromesas();
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('ms-notifications caído'),
    );
  });

  it('si enviar rechaza (asíncrono), no se propaga y se registra en el logger', async () => {
    correoService.enviar.mockRejectedValue(new Error('timeout'));
    ejecutar(Promise.resolve(['a@gmail.com']));
    await vaciarPromesas();
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('timeout'),
    );
  });
});
