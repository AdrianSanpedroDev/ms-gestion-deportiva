import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Not, Repository } from 'typeorm';
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
import { Deporte } from '../deporte/entities/deporte.entity';
import { CrearTorneoDto } from './dto/crear-torneo.dto';
import { FiltrosTorneoDto } from './dto/filtros-torneo.dto';
import { CambiarEstadoTorneoDto } from './dto/cambiar-estado-torneo.dto';
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
    @InjectRepository(Inscripcion) private readonly inscripciones: Repository<Inscripcion>,
  ) {}

  async crear(dto: CrearTorneoDto): Promise<TorneoResponseDto> {
    this.validarFechas(dto);
    const deporte = await this.buscarDeporte(dto.deporteId);
    if (await this.torneos.existsBy({ nombre: dto.nombre.trim() })) throw new ApplicationException(ErrorCase.ALREADY_EXISTS, `Ya existe un torneo con el nombre '${dto.nombre.trim()}'`);
    const torneo = this.torneos.create({
      nombre: dto.nombre.trim(), deporte, descripcion: dto.descripcion?.trim() ?? null,
      fechaInicio: dto.fechaInicio, fechaFin: dto.fechaFin,
      fechaCierreInscripciones: dto.fechaCierreInscripciones, maxEquipos: dto.maxEquipos ?? null,
      estado: EstadoTorneo.INSCRIPCIONES_ABIERTAS,
    });
    await this.torneos.save(torneo);
    return TorneoMapper.aResponse(torneo, 0);
  }
  async listar(filtros: FiltrosTorneoDto): Promise<TorneoResponseDto[]> {
    const where: FindOptionsWhere<Torneo> = {};
    if (filtros.nombre) where.nombre = Like(`%${filtros.nombre.trim()}%`);
    if (filtros.deporteId) where.deporte = { id: filtros.deporteId };
    if (filtros.estado) where.estado = filtros.estado;
    const torneos = await this.torneos.find({ where, relations: { deporte: true }, order: { nombre: 'ASC' } });
    const respuestas: TorneoResponseDto[] = [];
    for (const torneo of torneos) respuestas.push(TorneoMapper.aResponse(torneo, await this.inscripciones.countBy({ torneo: { id: torneo.id } })));
    return respuestas;
  }
  async obtener(id: number): Promise<TorneoResponseDto> {
    const torneo = await this.buscar(id);
    return TorneoMapper.aResponse(torneo, await this.inscripciones.countBy({ torneo: { id } }));
  }
  async actualizar(id: number, dto: CrearTorneoDto): Promise<TorneoResponseDto> {
    const torneo = await this.buscar(id);
    if (torneo.estado === EstadoTorneo.FINALIZADO || torneo.estado === EstadoTorneo.CANCELADO) throw new ApplicationException(ErrorCase.INVALID_OPERATION, 'No se puede editar un torneo finalizado o cancelado');
    this.validarFechas(dto);
    if (await this.torneos.existsBy({ nombre: dto.nombre.trim(), id: Not(id) })) throw new ApplicationException(ErrorCase.ALREADY_EXISTS, `Ya existe otro torneo con el nombre '${dto.nombre.trim()}'`);
    if (dto.deporteId !== torneo.deporte.id && await this.inscripciones.countBy({ torneo: { id } })) throw new ApplicationException(ErrorCase.INVALID_OPERATION, 'No se puede cambiar el deporte de un torneo con inscripciones');
    torneo.deporte = await this.buscarDeporte(dto.deporteId);
    this.torneos.merge(torneo, { nombre: dto.nombre.trim(), descripcion: dto.descripcion?.trim() ?? null, fechaInicio: dto.fechaInicio, fechaFin: dto.fechaFin, fechaCierreInscripciones: dto.fechaCierreInscripciones, maxEquipos: dto.maxEquipos ?? null });
    await this.torneos.save(torneo);
    return this.obtener(id);
  }
  async cambiarEstado(id: number, dto: CambiarEstadoTorneoDto): Promise<TorneoResponseDto> {
    const torneo = await this.buscar(id);
    if (!this.transicionPermitida(torneo.estado, dto.estado)) throw new ApplicationException(ErrorCase.INVALID_OPERATION, `No se puede cambiar el torneo de ${torneo.estado} a ${dto.estado}`);
    torneo.estado = dto.estado;
    await this.torneos.save(torneo);
    return this.obtener(id);
  }
  async eliminar(id: number): Promise<void> {
    const torneo = await this.buscar(id);
    const inscripciones = await this.inscripciones.countBy({ torneo: { id } });
    if (inscripciones) throw new ApplicationException(ErrorCase.HAS_ASSOCIATIONS, 'No se puede eliminar el torneo porque tiene inscripciones');
    await this.torneos.remove(torneo);
  }
  private validarFechas(dto: CrearTorneoDto): void {
    if (dto.fechaFin < dto.fechaInicio) throw new ApplicationException(ErrorCase.INVALID_OPERATION, 'La fecha fin debe ser igual o posterior a la fecha de inicio');
    if (dto.fechaCierreInscripciones > dto.fechaInicio) throw new ApplicationException(ErrorCase.INVALID_OPERATION, 'El cierre de inscripciones no puede ser posterior al inicio');
  }
  private transicionPermitida(actual: EstadoTorneo, siguiente: EstadoTorneo): boolean {
    const permitidas: Record<EstadoTorneo, EstadoTorneo[]> = {
      [EstadoTorneo.INSCRIPCIONES_ABIERTAS]: [EstadoTorneo.INSCRIPCIONES_CERRADAS, EstadoTorneo.CANCELADO],
      [EstadoTorneo.INSCRIPCIONES_CERRADAS]: [EstadoTorneo.INSCRIPCIONES_ABIERTAS, EstadoTorneo.EN_CURSO, EstadoTorneo.CANCELADO],
      [EstadoTorneo.EN_CURSO]: [EstadoTorneo.FINALIZADO, EstadoTorneo.CANCELADO],
      [EstadoTorneo.FINALIZADO]: [],
      [EstadoTorneo.CANCELADO]: [],
    };
    return permitidas[actual].includes(siguiente);
  }
  private async buscarDeporte(id: number): Promise<Deporte> {
    const deporte = await this.deportes.findOneBy({ id });
    if (!deporte) throw new ApplicationException(ErrorCase.NOT_FOUND, `No existe el deporte con id ${id}`);
    if (!deporte.activo) throw new ApplicationException(ErrorCase.INVALID_OPERATION, 'El deporte está inactivo');
    return deporte;
  }
  private async buscar(id: number): Promise<Torneo> {
    const torneo = await this.torneos.findOne({ where: { id }, relations: { deporte: true } });
    if (!torneo) throw new ApplicationException(ErrorCase.NOT_FOUND, `No existe el torneo con id ${id}`);
    return torneo;
  }
}
