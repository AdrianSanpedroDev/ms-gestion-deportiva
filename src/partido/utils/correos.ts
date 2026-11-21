// Helpers de B para los 3 correos de partidos (sección 8). Están en utils/ porque no traducen
// entidad ↔ DTO, no deciden reglas y no hablan con la BD: PREPARAN el texto del correo y lo DISPARAN.
// "import type": Logger y CorreoService solo se usan como TIPOS de los parámetros.
import type { Logger } from '@nestjs/common';
// TODO: ajustar la ruta cuando A suba common/notificacion (NotificacionModule @Global, sección 8)
import type { CorreoService } from '../../common/notificacion/correo.service';

// Escapa los 5 caracteres especiales de HTML, para que un nombre como "Tigres <FC>" se vea tal cual
// y no se interprete como una etiqueta. Se usa en el CUERPO del correo (el asunto es texto plano).
// El & va PRIMERO: si fuera después, volvería a escapar el & de "&lt;" y saldría "&amp;lt;".
export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Un solo texto para el minuto en los correos de anotación y de resumen: "minuto 23" o "sin minuto".
export function textoMinuto(minuto: number | null): string {
  if (minuto === null) {
    return 'sin minuto';
  }
  return `minuto ${minuto}`;
}

// Dispara un correo SIN bloquear la petición (sección 8). Quien llama NO pone await: la respuesta sale
// de inmediato y el correo se envía cuando lleguen los destinatarios.
// El .catch es obligatorio: si la promesa de destinatarios se rechaza y nadie la atrapa, Node lo trata
// como "unhandled rejection" (error fatal) y tumba el proceso. Aquí solo se registra en el log.
// "contexto" completa el mensaje del log, por ejemplo: "el correo del partido 7".
export function enviarEnSegundoPlano(
  destinatarios: Promise<string[]>,
  asunto: string,
  html: string,
  correoService: CorreoService,
  logger: Logger,
  contexto: string,
): void {
  destinatarios
    .then((lista: string[]) => correoService.enviar(lista, asunto, html))
    .catch((error: unknown) => {
      logger.error(`No se pudo enviar ${contexto}: ${String(error)}`);
    });
}
