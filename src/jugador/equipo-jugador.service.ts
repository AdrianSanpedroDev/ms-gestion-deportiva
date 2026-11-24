import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
import { Equipo } from '../equipo/entities/equipo.entity';
import { ContratoResponseDto } from './dto/contrato-response.dto';
import { CrearContratoDto } from './dto/crear-contrato.dto';
import { RetiroContratoDto } from './dto/retiro-contrato.dto';
import { EquipoJugador } from './entities/equipo-jugador.entity';
import { Jugador } from './entities/jugador.entity';
import { EquipoJugadorMapper } from './mappers/equipo-jugador.mapper';
import { JugadorMapper } from './mappers/jugador.mapper';
import { hoyBogota } from '../common/utils/fechas';

// HU-GD-05 · ACUERDOS 6.5 y 9.8. Contratos equipo ↔ jugador: asignar, listar y retirar (nunca borrar).
@Injectable()
export class EquipoJugadorService {
  constructor(
    @InjectRepository(EquipoJugador)
    private readonly equipoJugadorRepository: Repository<EquipoJugador>,
    @InjectRepository(Jugador)
    private readonly jugadorRepository: Repository<Jugador>,
    // Equipo es de A: SOLO lectura (findOneBy). Nunca save/delete sobre él ni inyectar EquipoService (ACUERDOS 7).
    @InjectRepository(Equipo)
    private readonly equipoRepository: Repository<Equipo>,
  ) {}

  async asignar(
    equipoId: number,
    dto: CrearContratoDto,
  ): Promise<ContratoResponseDto> {
    // 1. Primero que los dos EXISTAN (404): si falta cualquiera, no tiene sentido preguntar si está activo.
    const equipo = await this.buscarEquipo(equipoId);
    const jugador = await this.buscarJugador(dto.jugadorId);
    const nombreJugador = JugadorMapper.nombreCompleto(jugador); // una sola fuente para los mensajes

    // 2. Después que los dos estén ACTIVOS (400): no se asocia nada a un inactivo (5.4).
    if (!equipo.activo) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `El equipo '${equipo.nombre}' está inactivo y no puede recibir jugadores`,
      );
    }
    if (!jugador.activo) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `El jugador ${nombreJugador} está inactivo y no puede firmar contratos`,
      );
    }

    // 3. La fecha de fin debe ser MAYOR que la de inicio (6.5): si son iguales también es error, por eso "<=".
    // Las fechas "yyyy-MM-dd" se comparan como texto: el año va primero y todo tiene ceros a la izquierda.
    if (dto.fechaFin <= dto.fechaInicio) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        'La fecha de fin del contrato debe ser posterior a la fecha de inicio',
      );
    }

    // 4. No puede haber dos contratos ACTIVOS del mismo jugador con el mismo equipo (409).
    // Con otro equipo sí puede estar activo, y si el anterior está retirado puede volver a firmar (fila nueva).
    const yaTieneContratoActivo = await this.equipoJugadorRepository.existsBy({
      equipo: { id: equipoId },
      jugador: { id: dto.jugadorId },
      activo: true,
    });
    if (yaTieneContratoActivo) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `El jugador ${nombreJugador} ya tiene un contrato activo con el equipo '${equipo.nombre}'`,
      );
    }

    // 5. Crear (sin tocar la BD), guardar (INSERT) y responder con el DTO.
    const contrato = this.equipoJugadorRepository.create(
      EquipoJugadorMapper.aDatosEntidad(dto, equipo, jugador),
    );
    await this.equipoJugadorRepository.save(contrato);
    return EquipoJugadorMapper.aResponse(contrato);
  }

  // GET /api/equipos/{equipoId}/jugadores: la plantilla del equipo.
  async listarPorEquipo(
    equipoId: number,
    incluirHistorial?: boolean,
  ): Promise<ContratoResponseDto[]> {
    await this.buscarEquipo(equipoId); // solo para el 404 si no existe
    return this.listarContratos({ equipo: { id: equipoId } }, incluirHistorial);
  }

  // GET /api/jugadores/{jugadorId}/equipos: los equipos del jugador.
  async listarPorJugador(
    jugadorId: number,
    incluirHistorial?: boolean,
  ): Promise<ContratoResponseDto[]> {
    await this.buscarJugador(jugadorId); // solo para el 404 si no existe
    return this.listarContratos(
      { jugador: { id: jugadorId } },
      incluirHistorial,
    );
  }

  // Retirar ≠ borrar: la fila se queda con activo = false y su fecha de retiro (historial de traspasos, 6.5).
  async retirar(
    equipoId: number,
    jugadorId: number,
    dto: RetiroContratoDto = {},
  ): Promise<ContratoResponseDto> {
    // Solo se retira el contrato ACTIVO de esa pareja; los retirados ya son historial.
    const contrato = await this.equipoJugadorRepository.findOne({
      where: {
        equipo: { id: equipoId },
        jugador: { id: jugadorId },
        activo: true,
      },
      relations: { equipo: true, jugador: true },
    });
    if (!contrato) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No hay un contrato activo del jugador con id ${jugadorId} en el equipo con id ${equipoId} para retirar`,
      );
    }

    contrato.activo = false;
    contrato.fechaRetiro = dto?.fechaRetiro ?? hoyBogota(); // si no la envían, es hoy en Bogotá (9.8)
    await this.equipoJugadorRepository.save(contrato); // save con id = UPDATE, nunca remove
    return EquipoJugadorMapper.aResponse(contrato);
  }

  // Parte común de los dos listados. Por defecto solo activos; con incluirHistorial=true, todos.
  private async listarContratos(
    where: FindOptionsWhere<EquipoJugador>,
    incluirHistorial?: boolean,
  ): Promise<ContratoResponseDto[]> {
    if (!incluirHistorial) {
      where.activo = true;
    }
    const contratos = await this.equipoJugadorRepository.find({
      where,
      relations: { equipo: true, jugador: true }, // el mapper necesita equipo y jugador cargados
      order: { fechaInicio: 'DESC', id: 'DESC' }, // del más reciente al más antiguo
    });
    return contratos.map((contrato) => EquipoJugadorMapper.aResponse(contrato));
  }

  // Equipo de A: solo se LEE. findOneBy devuelve null (no lanza) → el 404 lo lanzamos nosotros.
  private async buscarEquipo(id: number): Promise<Equipo> {
    const equipo = await this.equipoRepository.findOneBy({ id });
    if (!equipo) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe el equipo con id ${id}`,
      );
    }
    return equipo;
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
}
