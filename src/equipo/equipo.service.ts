import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Not, Repository } from 'typeorm';
import { EstadoDto } from '../common/dto/estado.dto';
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
import { hoyBogota } from '../common/utils/fechas';
import { EquipoJugador } from '../jugador/entities/equipo-jugador.entity';
import { Inscripcion } from '../torneo/entities/inscripcion.entity';
import { CrearEquipoDto } from './dto/crear-equipo.dto';
import { EquipoResponseDto } from './dto/equipo-response.dto';
import { FiltrosEquipoDto } from './dto/filtros-equipo.dto';
import { EquipoDeporte } from './entities/equipo-deporte.entity';
import { Equipo } from './entities/equipo.entity';
import { EquipoMapper } from './mappers/equipo.mapper';

@Injectable()
export class EquipoService {
  constructor(
    @InjectRepository(Equipo) private readonly equipos: Repository<Equipo>,
    @InjectRepository(EquipoDeporte) private readonly asociaciones: Repository<EquipoDeporte>,
    @InjectRepository(EquipoJugador) private readonly contratos: Repository<EquipoJugador>,
    @InjectRepository(Inscripcion) private readonly inscripciones: Repository<Inscripcion>,
  ) {}

  async crear(dto: CrearEquipoDto): Promise<EquipoResponseDto> {
    this.validar(dto);
    if (await this.equipos.existsBy({ nombre: dto.nombre.trim() })) throw new ApplicationException(ErrorCase.ALREADY_EXISTS, `Ya existe un equipo con el nombre '${dto.nombre.trim()}'`);
    const equipo = this.equipos.create(EquipoMapper.aDatosEntidad(dto));
    await this.equipos.save(equipo);
    return EquipoMapper.aResponse(equipo);
  }
  async listar(filtros: FiltrosEquipoDto): Promise<EquipoResponseDto[]> {
    const where: FindOptionsWhere<Equipo> = {};
    if (filtros.nombre) where.nombre = Like(`%${filtros.nombre.trim()}%`);
    if (filtros.ciudad) where.ciudad = Like(`%${filtros.ciudad.trim()}%`);
    if (filtros.activo !== undefined) where.activo = filtros.activo;
    const equipos = await this.equipos.find({ where, order: { nombre: 'ASC' } });
    return equipos.map((item) => EquipoMapper.aResponse(item));
  }
  async obtener(id: number): Promise<EquipoResponseDto> { return EquipoMapper.aResponse(await this.buscar(id)); }
  async actualizar(id: number, dto: CrearEquipoDto): Promise<EquipoResponseDto> {
    this.validar(dto);
    const equipo = await this.buscar(id);
    if (await this.equipos.existsBy({ nombre: dto.nombre.trim(), id: Not(id) })) throw new ApplicationException(ErrorCase.ALREADY_EXISTS, `Ya existe otro equipo con el nombre '${dto.nombre.trim()}'`);
    this.equipos.merge(equipo, EquipoMapper.aDatosEntidad(dto));
    await this.equipos.save(equipo);
    return EquipoMapper.aResponse(equipo);
  }
  async cambiarEstado(id: number, dto: EstadoDto): Promise<EquipoResponseDto> {
    const equipo = await this.buscar(id);
    equipo.activo = dto.activo;
    await this.equipos.save(equipo);
    return EquipoMapper.aResponse(equipo);
  }
  async eliminar(id: number): Promise<void> {
    const equipo = await this.buscar(id);
    const deportes = await this.asociaciones.countBy({ equipo: { id } });
    const contratos = await this.contratos.countBy({ equipo: { id } });
    const inscripciones = await this.inscripciones.countBy({ equipo: { id } });
    if (deportes || contratos || inscripciones) throw new ApplicationException(ErrorCase.HAS_ASSOCIATIONS, `No se puede eliminar el equipo '${equipo.nombre}' porque tiene datos asociados`);
    await this.equipos.remove(equipo);
  }
  private validar(dto: CrearEquipoDto): void {
    if (dto.fechaFundacion && dto.fechaFundacion > hoyBogota()) throw new ApplicationException(ErrorCase.INVALID_OPERATION, 'La fecha de fundación no puede ser futura');
  }
  private async buscar(id: number): Promise<Equipo> {
    const equipo = await this.equipos.findOneBy({ id });
    if (!equipo) throw new ApplicationException(ErrorCase.NOT_FOUND, `No existe el equipo con id ${id}`);
    return equipo;
  }
}
