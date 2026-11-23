import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Not, Repository } from 'typeorm';
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
import { EstadoDto } from '../common/dto/estado.dto';
import { EquipoDeporte } from '../equipo/entities/equipo-deporte.entity';
import { Inscripcion } from '../torneo/entities/inscripcion.entity';
import { Torneo } from '../torneo/entities/torneo.entity';
import { CrearDeporteDto } from './dto/crear-deporte.dto';
import { DeporteResponseDto } from './dto/deporte-response.dto';
import { FiltrosDeporteDto } from './dto/filtros-deporte.dto';
import { Deporte } from './entities/deporte.entity';
import { DeporteMapper } from './mappers/deporte.mapper';

@Injectable()
export class DeporteService {
  constructor(
    @InjectRepository(Deporte) private readonly deportes: Repository<Deporte>,
    @InjectRepository(Deporte) private readonly deportePadres: Repository<Deporte>,
    @InjectRepository(Torneo) private readonly torneos: Repository<Torneo>,
    @InjectRepository(EquipoDeporte) private readonly equipoDeportes: Repository<EquipoDeporte>,
  ) {}

  async crear(dto: CrearDeporteDto): Promise<DeporteResponseDto> {
    await this.validarNombre(dto.nombre);
    const padre = dto.deportePadreId ? await this.buscarPadre(dto.deportePadreId) : null;
    const deporte = this.deportes.create({ ...DeporteMapper.aDatosEntidad(dto), deportePadre: padre });
    await this.deportes.save(deporte);
    deporte.subdeportes = [];
    return DeporteMapper.aResponse(deporte);
  }

  async listar(filtros: FiltrosDeporteDto): Promise<DeporteResponseDto[]> {
    const where: FindOptionsWhere<Deporte> = {};
    if (filtros.nombre) where.nombre = Like(`%${filtros.nombre.trim()}%`);
    if (filtros.activo !== undefined) where.activo = filtros.activo;
    if (filtros.soloPrincipales) where.deportePadre = null as never;
    const deportes = await this.deportes.find({ where, relations: { deportePadre: true, subdeportes: true }, order: { nombre: 'ASC' } });
    return deportes.map((item) => DeporteMapper.aResponse(item));
  }

  async obtener(id: number): Promise<DeporteResponseDto> {
    const deporte = await this.buscar(id);
    return DeporteMapper.aResponse(deporte);
  }

  async subdeportes(id: number): Promise<ReturnType<typeof DeporteMapper.aResumen>[] > {
    await this.buscar(id);
    const subdeportes = await this.deportes.find({ where: { deportePadre: { id } }, order: { nombre: 'ASC' } });
    return subdeportes.map((item) => DeporteMapper.aResumen(item));
  }

  async actualizar(id: number, dto: CrearDeporteDto): Promise<DeporteResponseDto> {
    const deporte = await this.buscar(id);
    if (await this.deportes.existsBy({ nombre: dto.nombre.trim(), id: Not(id) })) {
      throw new ApplicationException(ErrorCase.ALREADY_EXISTS, `Ya existe otro deporte con el nombre '${dto.nombre.trim()}'`);
    }
    if (dto.deportePadreId) {
      if (dto.deportePadreId === id) throw new ApplicationException(ErrorCase.INVALID_OPERATION, 'Un deporte no puede ser su propio padre');
      const padre = await this.buscarPadre(dto.deportePadreId);
      deporte.deportePadre = padre;
    } else {
      deporte.deportePadre = null;
    }
    this.deportes.merge(deporte, DeporteMapper.aDatosEntidad(dto));
    await this.deportes.save(deporte);
    return this.obtener(id);
  }

  async cambiarEstado(id: number, dto: EstadoDto): Promise<DeporteResponseDto> {
    const deporte = await this.buscar(id);
    deporte.activo = dto.activo;
    await this.deportes.save(deporte);
    return this.obtener(id);
  }

  async eliminar(id: number): Promise<void> {
    const deporte = await this.buscar(id);
    const subdeportes = await this.deportes.countBy({ deportePadre: { id } });
    const equipos = await this.equipoDeportes.countBy({ deporte: { id } });
    const torneos = await this.torneos.countBy({ deporte: { id } });
    if (subdeportes || equipos || torneos) {
      throw new ApplicationException(ErrorCase.HAS_ASSOCIATIONS, `No se puede eliminar el deporte '${deporte.nombre}' porque tiene datos asociados`);
    }
    await this.deportes.remove(deporte);
  }

  private async validarNombre(nombre: string): Promise<void> {
    if (await this.deportes.existsBy({ nombre: nombre.trim() })) {
      throw new ApplicationException(ErrorCase.ALREADY_EXISTS, `Ya existe un deporte con el nombre '${nombre.trim()}'`);
    }
  }

  private async buscarPadre(id: number): Promise<Deporte> {
    const padre = await this.deportes.findOneBy({ id });
    if (!padre) throw new ApplicationException(ErrorCase.NOT_FOUND, `No existe el deporte padre con id ${id}`);
    if (!padre.activo) throw new ApplicationException(ErrorCase.INVALID_OPERATION, 'El deporte padre está inactivo');
    if (padre.deportePadre) throw new ApplicationException(ErrorCase.INVALID_OPERATION, 'Solo se permiten dos niveles de deportes');
    return padre;
  }

  private async buscar(id: number): Promise<Deporte> {
    const deporte = await this.deportes.findOne({ where: { id }, relations: { deportePadre: true, subdeportes: true } });
    if (!deporte) throw new ApplicationException(ErrorCase.NOT_FOUND, `No existe el deporte con id ${id}`);
    return deporte;
  }
}
