import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class CorreoService {
  private readonly logger = new Logger(CorreoService.name);

  constructor(private readonly config: ConfigService) {}

  enviar(destinatarios: string[], asunto: string, cuerpoHtml: string): void {
    const url = this.config.get<string>('MS_NOTIFICATIONS');
    const key = this.config.get<string>('EMAIL_SERVICE_API_KEY');
    if (!url || destinatarios.length === 0) return;

    void axios
      .post(
        `${url}/api/notifications/send`,
        { to: destinatarios, subject: asunto, html: cuerpoHtml },
        { headers: { 'X-Service-Key': key ?? '' }, timeout: 5000 },
      )
      .catch((error) => this.logger.warn(`No se pudo enviar correo: ${String(error)}`));
  }
}
