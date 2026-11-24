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
    @InjectRepository(EquipoDeporte)
    private readonly asociaciones: Repository<EquipoDeporte>,
    @InjectRepository(EquipoJugador)
    private readonly contratos: Repository<EquipoJugador>,
    @InjectRepository(Inscripcion)
    private readonly inscripciones: Repository<Inscripcion>,
  ) {}

  async crear(dto: CrearEquipoDto): Promise<EquipoResponseDto> {
    this.validar(dto);
    const nombreLimpio = dto.nombre.trim();
    if (await this.equipos.existsBy({ nombre: nombreLimpio })) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `Ya existe un equipo con el nombre '${nombreLimpio}'`,
      );
    }
    const equipo = this.equipos.create(EquipoMapper.aDatosEntidad(dto));
    await this.equipos.save(equipo);
    return EquipoMapper.aResponse(equipo);
  }

  async listar(filtros: FiltrosEquipoDto): Promise<EquipoResponseDto[]> {
    const where: FindOptionsWhere<Equipo> = {};
    if (filtros.nombre?.trim()) where.nombre = Like(`%${filtros.nombre.trim()}%`);
    if (filtros.ciudad?.trim()) where.ciudad = Like(`%${filtros.ciudad.trim()}%`);
    if (filtros.activo !== undefined) where.activo = filtros.activo;
    const equipos = await this.equipos.find({ where, order: { nombre: 'ASC' } });
    return equipos.map((item) => EquipoMapper.aResponse(item));
  }

  async obtener(id: number): Promise<EquipoResponseDto> {
    return EquipoMapper.aResponse(await this.buscar(id));
  }

  async actualizar(
    id: number,
    dto: CrearEquipoDto,
  ): Promise<EquipoResponseDto> {
    this.validar(dto);
    const equipo = await this.buscar(id);
    const nombreLimpio = dto.nombre.trim();
    if (await this.equipos.existsBy({ nombre: nombreLimpio, id: Not(id) })) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `Ya existe otro equipo con el nombre '${nombreLimpio}'`,
      );
    }
    this.equipos.merge(equipo, EquipoMapper.aDatosEntidad(dto));
    await this.equipos.save(equipo);
    return EquipoMapper.aResponse(equipo);
  }

  async cambiarEstado(
    id: number,
    dto: EstadoDto,
  ): Promise<EquipoResponseDto> {
    const equipo = await this.buscar(id);
    equipo.activo = dto.activo;
    await this.equipos.save(equipo);
    return EquipoMapper.aResponse(equipo);
  }

  async eliminar(id: number): Promise<void> {
    const equipo = await this.buscar(id);
    const [deportes, contratos, inscripciones] = await Promise.all([
      this.asociaciones.countBy({ equipo: { id } }),
      this.contratos.countBy({ equipo: { id } }),
      this.inscripciones.countBy({ equipo: { id } }),
    ]);

    const motivos: string[] = [];
    if (deportes > 0) motivos.push(`${deportes} deporte(s) asociado(s)`);
    if (contratos > 0) motivos.push(`${contratos} contrato(s) de jugador`);
    if (inscripciones > 0) motivos.push(`${inscripciones} inscripción(es) en torneos`);

    if (motivos.length > 0) {
      throw new ApplicationException(
        ErrorCase.HAS_ASSOCIATIONS,
        `No se puede eliminar el equipo '${equipo.nombre}' porque tiene ${motivos.join(', ')}. Puede desactivarlo.`,
      );
    }
    await this.equipos.remove(equipo);
  }

  private validar(dto: CrearEquipoDto): void {
    if (dto.fechaFundacion && dto.fechaFundacion > hoyBogota()) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        'La fecha de fundación no puede ser futura',
      );
    }
  }

  private async buscar(id: number): Promise<Equipo> {
    const equipo = await this.equipos.findOneBy({ id });
    if (!equipo) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe el equipo con id ${id}`,
      );
    }
    return equipo;
  }
}
