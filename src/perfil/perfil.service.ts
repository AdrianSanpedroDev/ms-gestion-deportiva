import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// TODO: verificar ruta cuando A suba common/errores y common/utils (ACUERDOS 5.3, 5.5 y 13.1)
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
import { HabilidadJugador } from '../habilidad-jugador/entities/habilidad-jugador.entity';
// Entidades de B: SOLO lectura (ACUERDOS 7 y 13.3). Nunca save/update/delete ni inyectar sus services.
import { EquipoJugador } from '../jugador/entities/equipo-jugador.entity';
import { Jugador } from '../jugador/entities/jugador.entity';
// TODO: reemplazar por hoyBogota() de common/utils cuando A lo suba (ACUERDOS 5.5 y 13.2)
import { hoyBogota } from '../jugador/utils/fechas';
import { PerfilJugadorResponseDto } from './dto/perfil-jugador-response.dto';
import { PerfilMapper } from './mappers/perfil.mapper';

// HU-GD-08 · ACUERDOS 7 y 9.13. Consulta consolidada de solo lectura del perfil deportivo del jugador.
@Injectable()
export class PerfilService {
  constructor(
    // De B, solo lectura.
    @InjectRepository(Jugador)
    private readonly jugadorRepository: Repository<Jugador>,
    @InjectRepository(EquipoJugador)
    private readonly equipoJugadorRepository: Repository<EquipoJugador>,
    // De C, solo lectura.
    @InjectRepository(HabilidadJugador)
    private readonly habilidadJugadorRepository: Repository<HabilidadJugador>,
  ) {}

  // GET /api/jugadores/{jugadorId}/perfil
  async obtenerPerfil(jugadorId: number): Promise<PerfilJugadorResponseDto> {
    const jugador = await this.jugadorRepository.findOneBy({ id: jugadorId });
    if (!jugador) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe el jugador con id ${jugadorId}`,
      );
    }

    const [contratos, asignacionesHabilidad] = await Promise.all([
      this.equipoJugadorRepository.find({
        where: { jugador: { id: jugadorId } },
        relations: { equipo: true },
        order: { fechaInicio: 'DESC' },
      }),
      this.habilidadJugadorRepository.find({
        where: { jugador: { id: jugadorId } },
        relations: { habilidad: true },
        order: { habilidad: { nombre: 'ASC' } },
      }),
    ]);

    return PerfilMapper.aResponse(
      jugador,
      contratos,
      asignacionesHabilidad,
      hoyBogota(),
    );
  }
}
