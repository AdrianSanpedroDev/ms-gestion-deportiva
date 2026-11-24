import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DestinatariosService {
  constructor(private readonly config: ConfigService) {}

  async aficionadosDeEquipos(
    _equipoLocalId: number,
    _equipoVisitanteId: number,
  ): Promise<string[]> {
    return this.correosPrueba();
  }

  async aficionadosDelPartido(_partidoId: number): Promise<string[]> {
    return this.correosPrueba();
  }

  private correosPrueba(): string[] {
    const vistos = new Set<string>();
    const resultado: string[] = [];
    const crudos = (
      this.config.get<string>('NOTIFICACIONES_CORREOS_PRUEBA') ?? ''
    )
      .split(',')
      .map((correo) => correo.trim())
      .filter((correo) => correo.length > 0);

    for (const correo of crudos) {
      const clave = correo.toLowerCase();
      if (!vistos.has(clave)) {
        vistos.add(clave);
        resultado.push(correo);
      }
    }
    return resultado;
  }
}
