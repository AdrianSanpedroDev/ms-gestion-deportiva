import { Global, Module } from '@nestjs/common';
import { CorreoService } from './correo.service';
import { DestinatariosService } from './destinatarios.service';

@Global()
@Module({
  providers: [CorreoService, DestinatariosService],
  exports: [CorreoService, DestinatariosService],
})
export class NotificacionModule {}
