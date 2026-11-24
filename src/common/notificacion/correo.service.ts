import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class CorreoService {
  private readonly logger = new Logger(CorreoService.name);

  constructor(private readonly config: ConfigService) {}

  enviar(destinatarios: string[], asunto: string, cuerpoHtml: string): void {
    const url = this.config
      .get<string>('MS_NOTIFICATIONS')
      ?.trim()
      .replace(/\/+$/, '');
    const key = this.config.get<string>('EMAIL_SERVICE_API_KEY')?.trim();
    if (!url || destinatarios.length === 0) return;

    if (!key) {
      this.logger.warn(
        'EMAIL_SERVICE_API_KEY no está configurada; se omite el envío de correo',
      );
      return;
    }

    void axios
      .post(
        `${url}/api/notifications/send`,
        { to: destinatarios, subject: asunto, html: cuerpoHtml },
        { headers: { 'X-Service-Key': key }, timeout: 10000 },
      )
      .catch((error) =>
        this.logger.error(`No se pudo enviar correo: ${String(error)}`),
      );
  }
}
