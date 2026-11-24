import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Not, Repository } from 'typeorm';
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
import { Deporte } from '../deporte/entities/deporte.entity';
import { Fase } from '../fase/entities/fase.entity';
import { CambiarEstadoTorneoDto } from './dto/cambiar-estado-torneo.dto';
import { CrearTorneoDto } from './dto/crear-torneo.dto';
import { FiltrosTorneoDto } from './dto/filtros-torneo.dto';
import { TorneoResponseDto } from './dto/torneo-response.dto';
import { EstadoTorneo } from './entities/estado-torneo.enum';
import { Inscripcion } from './entities/inscripcion.entity';
import { Torneo } from './entities/torneo.entity';
import { TorneoMapper } from './mappers/torneo.mapper';

@Injectable()
export class TorneoService {
  constructor(
    @InjectRepository(Torneo) private readonly torneos: Repository<Torneo>,
    @InjectRepository(Deporte) private readonly deportes: Repository<Deporte>,
    @InjectRepository(Inscripcion)
    private readonly inscripciones: Repository<Inscripcion>,
    @InjectRepository(Fase) private readonly fases: Repository<Fase>,
  ) {}

  async crear(dto: CrearTorneoDto): Promise<TorneoResponseDto> {
    this.validarFechas(dto);
    const deporte = await this.buscarDeporteActivo(dto.deporteId);
    const nombreLimpio = dto.nombre.trim();
    if (await this.torneos.existsBy({ nombre: nombreLimpio })) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `Ya existe un torneo con el nombre '${nombreLimpio}'`,
      );
    }
    const torneo = this.torneos.create({
      nombre: nombreLimpio,
      deporte,
      descripcion: dto.descripcion?.trim() || null,
      fechaInicio: dto.fechaInicio,
      fechaFin: dto.fechaFin,
      fechaCierreInscripciones: dto.fechaCierreInscripciones,
      maxEquipos: dto.maxEquipos ?? null,
      estado: EstadoTorneo.INSCRIPCIONES_ABIERTAS,
    });
    await this.torneos.save(torneo);
    return TorneoMapper.aResponse(torneo, 0);
  }

  async listar(filtros: FiltrosTorneoDto): Promise<TorneoResponseDto[]> {
    const where: FindOptionsWhere<Torneo> = {};
    if (filtros.nombre?.trim()) {
      where.nombre = Like(`%${filtros.nombre.trim()}%`);
    }
    if (filtros.deporteId) where.deporte = { id: filtros.deporteId };
    if (filtros.estado) where.estado = filtros.estado;

    const torneos = await this.torneos.find({
      where,
      relations: { deporte: true },
      order: { nombre: 'ASC' },
    });
    if (torneos.length === 0) return [];

    const conteos = await this.contarInscritosPorTorneo(
      torneos.map((t) => t.id),
    );
    return torneos.map((torneo) =>
      TorneoMapper.aResponse(torneo, conteos.get(torneo.id) ?? 0),
    );
  }

  async obtener(id: number): Promise<TorneoResponseDto> {
    const torneo = await this.buscar(id);
    const inscritos = await this.inscripciones.countBy({ torneo: { id } });
    return TorneoMapper.aResponse(torneo, inscritos);
  }

  async actualizar(
    id: number,
    dto: CrearTorneoDto,
  ): Promise<TorneoResponseDto> {
    const torneo = await this.buscar(id);
    if (
      torneo.estado === EstadoTorneo.FINALIZADO ||
      torneo.estado === EstadoTorneo.CANCELADO
    ) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        'No se puede editar un torneo finalizado o cancelado',
      );
    }
    this.validarFechas(dto);

    const nombreLimpio = dto.nombre.trim();
    if (await this.torneos.existsBy({ nombre: nombreLimpio, id: Not(id) })) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `Ya existe otro torneo con el nombre '${nombreLimpio}'`,
      );
    }

    const cantidadInscritos = await this.inscripciones.countBy({
      torneo: { id },
    });
    if (dto.deporteId !== torneo.deporte.id) {
      if (cantidadInscritos > 0) {
        throw new ApplicationException(
          ErrorCase.INVALID_OPERATION,
          'No se puede cambiar el deporte de un torneo con inscripciones',
        );
      }
      torneo.deporte = await this.buscarDeporteActivo(dto.deporteId);
    }

    if (
      dto.maxEquipos !== undefined &&
      dto.maxEquipos !== null &&
      dto.maxEquipos < cantidadInscritos
    ) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `El máximo de equipos (${dto.maxEquipos}) no puede ser menor que los equipos ya inscritos (${cantidadInscritos})`,
      );
    }

    this.torneos.merge(torneo, {
      nombre: nombreLimpio,
      descripcion: dto.descripcion?.trim() || null,
      fechaInicio: dto.fechaInicio,
      fechaFin: dto.fechaFin,
      fechaCierreInscripciones: dto.fechaCierreInscripciones,
      maxEquipos: dto.maxEquipos ?? null,
    });
    await this.torneos.save(torneo);
    return this.obtener(id);
  }

  async cambiarEstado(
    id: number,
    dto: CambiarEstadoTorneoDto,
  ): Promise<TorneoResponseDto> {
    const torneo = await this.buscar(id);
    if (!this.transicionPermitida(torneo.estado, dto.estado)) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `No se puede cambiar el torneo de ${torneo.estado} a ${dto.estado}`,
      );
    }
    torneo.estado = dto.estado;
    await this.torneos.save(torneo);
    return this.obtener(id);
  }

  async eliminar(id: number): Promise<void> {
    const torneo = await this.buscar(id);
    const [inscripciones, fases] = await Promise.all([
      this.inscripciones.countBy({ torneo: { id } }),
      this.fases.countBy({ torneo: { id } }),
    ]);

    const motivos: string[] = [];
    if (inscripciones > 0) motivos.push(`${inscripciones} inscripción(es)`);
    if (fases > 0) motivos.push(`${fases} fase(s)`);

    if (motivos.length > 0) {
      throw new ApplicationException(
        ErrorCase.HAS_ASSOCIATIONS,
        `No se puede eliminar el torneo '${torneo.nombre}' porque tiene ${motivos.join(' y ')}. Puede cancelarlo.`,
      );
    }
    await this.torneos.remove(torneo);
  }

  private async contarInscritosPorTorneo(
    torneoIds: number[],
  ): Promise<Map<number, number>> {
    const mapa = new Map<number, number>();
    if (torneoIds.length === 0) return mapa;

    const filas = await this.inscripciones
      .createQueryBuilder('i')
      .select('i.torneo_id', 'torneoId')
      .addSelect('COUNT(i.id)', 'total')
      .where('i.torneo_id IN (:...torneoIds)', { torneoIds })
      .groupBy('i.torneo_id')
      .getRawMany<{ torneoId: string; total: string }>();

    for (const fila of filas) {
      mapa.set(Number(fila.torneoId), Number(fila.total));
    }
    return mapa;
  }

  private validarFechas(dto: CrearTorneoDto): void {
    if (dto.fechaFin < dto.fechaInicio) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        'La fecha fin debe ser igual o posterior a la fecha de inicio',
      );
    }
    if (dto.fechaCierreInscripciones > dto.fechaInicio) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        'El cierre de inscripciones no puede ser posterior al inicio',
      );
    }
  }

  private transicionPermitida(
    actual: EstadoTorneo,
    siguiente: EstadoTorneo,
  ): boolean {
    const permitidas: Record<EstadoTorneo, EstadoTorneo[]> = {
      [EstadoTorneo.INSCRIPCIONES_ABIERTAS]: [
        EstadoTorneo.INSCRIPCIONES_CERRADAS,
        EstadoTorneo.CANCELADO,
      ],
      [EstadoTorneo.INSCRIPCIONES_CERRADAS]: [
        EstadoTorneo.INSCRIPCIONES_ABIERTAS,
        EstadoTorneo.EN_CURSO,
        EstadoTorneo.CANCELADO,
      ],
      [EstadoTorneo.EN_CURSO]: [
        EstadoTorneo.FINALIZADO,
        EstadoTorneo.CANCELADO,
      ],
      [EstadoTorneo.FINALIZADO]: [],
      [EstadoTorneo.CANCELADO]: [],
    };
    return permitidas[actual].includes(siguiente);
  }

  private async buscarDeporteActivo(id: number): Promise<Deporte> {
    const deporte = await this.deportes.findOneBy({ id });
    if (!deporte) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe el deporte con id ${id}`,
      );
    }
    if (!deporte.activo) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        'El deporte está inactivo',
      );
    }
    return deporte;
  }

  private async buscar(id: number): Promise<Torneo> {
    const torneo = await this.torneos.findOne({
      where: { id },
      relations: { deporte: true },
    });
    if (!torneo) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe el torneo con id ${id}`,
      );
    }
    return torneo;
  }
}
