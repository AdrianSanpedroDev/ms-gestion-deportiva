import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { JugadorResumen } from '../common/dto/jugador-resumen.dto';
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
// Entidades de B: SOLO lectura (ACUERDOS 7 y 13.3). Nunca save/update/delete ni inyectar sus services.
import { Habilidad } from '../habilidad/entities/habilidad.entity';
import { Jugador } from '../jugador/entities/jugador.entity';
import { JugadorMapper } from '../jugador/mappers/jugador.mapper';
import { AsignarHabilidadDto } from './dto/asignar-habilidad.dto';
import type { HabilidadResumen } from './dto/habilidad-resumen.dto';
import { HabilidadJugador } from './entities/habilidad-jugador.entity';
import { HabilidadJugadorMapper } from './mappers/habilidad-jugador.mapper';

// HU-GD-07 · ACUERDOS 6.7 y 9.12. Asignar, consultar y retirar habilidades de jugadores.
@Injectable()
export class HabilidadJugadorService {
  constructor(
    @InjectRepository(HabilidadJugador)
    private readonly habilidadJugadorRepository: Repository<HabilidadJugador>,
    // De B, solo lectura.
    @InjectRepository(Jugador)
    private readonly jugadorRepository: Repository<Jugador>,
    @InjectRepository(Habilidad)
    private readonly habilidadRepository: Repository<Habilidad>,
  ) {}

  async asignar(
    jugadorId: number,
    dto: AsignarHabilidadDto,
  ): Promise<HabilidadResumen> {
    // 1. Verificar que tanto el jugador como la habilidad existan (404).
    const jugador = await this.buscarJugador(jugadorId);
    const habilidad = await this.buscarHabilidad(dto.habilidadId);
    const nombreJugador = JugadorMapper.nombreCompleto(jugador);

    // 2. No se pueden asignar habilidades a un jugador inactivo (400 INVALID_OPERATION, ACUERDOS 5.4 y 9.12).
    if (!jugador.activo) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `El jugador ${nombreJugador} está inactivo y no se le pueden asignar habilidades`,
      );
    }

    // 3. Evitar asignar dos veces la misma habilidad al mismo jugador (409 ALREADY_EXISTS).
    const yaAsignada = await this.habilidadJugadorRepository.existsBy({
      jugador: { id: jugadorId },
      habilidad: { id: dto.habilidadId },
    });
    if (yaAsignada) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `El jugador ${nombreJugador} ya tiene asignada la habilidad '${habilidad.nombre}'`,
      );
    }

    // 4. Crear y guardar la relación; responder con HabilidadResumen (nunca la entidad).
    const asignacion = this.habilidadJugadorRepository.create(
      HabilidadJugadorMapper.aDatosEntidad(jugador, habilidad),
    );
    await this.habilidadJugadorRepository.save(asignacion);
    return HabilidadJugadorMapper.aHabilidadResumen(habilidad);
  }

  // GET /api/jugadores/{jugadorId}/habilidades
  async listarHabilidadesPorJugador(
    jugadorId: number,
  ): Promise<HabilidadResumen[]> {
    await this.buscarJugador(jugadorId);

    const asignaciones = await this.habilidadJugadorRepository.find({
      where: { jugador: { id: jugadorId } },
      relations: { habilidad: true },
      order: { habilidad: { nombre: 'ASC' } },
    });
    return asignaciones.map((asignacion) =>
      HabilidadJugadorMapper.aHabilidadResumen(asignacion.habilidad),
    );
  }

  // GET /api/habilidades/{habilidadId}/jugadores
  async listarJugadoresPorHabilidad(
    habilidadId: number,
  ): Promise<JugadorResumen[]> {
    await this.buscarHabilidad(habilidadId);

    const asignaciones = await this.habilidadJugadorRepository.find({
      where: { habilidad: { id: habilidadId } },
      relations: { jugador: true },
      order: { jugador: { apellidos: 'ASC', nombres: 'ASC' } },
    });
    return asignaciones.map((asignacion) =>
      HabilidadJugadorMapper.aJugadorResumen(asignacion.jugador),
    );
  }

  // DELETE /api/jugadores/{jugadorId}/habilidades/{habilidadId}
  // Retirar = borrar únicamente la fila de habilidad_jugador; la habilidad y el jugador siguen existiendo (6.7).
  async retirar(jugadorId: number, habilidadId: number): Promise<void> {
    const jugador = await this.buscarJugador(jugadorId);
    const habilidad = await this.buscarHabilidad(habilidadId);

    const asignacion = await this.habilidadJugadorRepository.findOneBy({
      jugador: { id: jugadorId },
      habilidad: { id: habilidadId },
    });
    if (!asignacion) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `El jugador ${JugadorMapper.nombreCompleto(jugador)} no tiene asignada la habilidad '${habilidad.nombre}'`,
      );
    }

    await this.habilidadJugadorRepository.remove(asignacion);
  }

  private async buscarJugador(id: number): Promise<Jugador> {
    const jugador = await this.jugadorRepository.findOneBy({ id });
    if (!jugador) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe el jugador con id ${id}`,
      );
    }
    return jugador;
  }

  private async buscarHabilidad(id: number): Promise<Habilidad> {
    const habilidad = await this.habilidadRepository.findOneBy({ id });
    if (!habilidad) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe la habilidad con id ${id}`,
      );
    }
    return habilidad;
  }
}
