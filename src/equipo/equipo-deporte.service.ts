import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeporteResumenDto } from '../common/dto/deporte-resumen.dto';
import { EquipoResumenDto } from '../common/dto/equipo-resumen.dto';
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
import { Deporte } from '../deporte/entities/deporte.entity';
import { DeporteMapper } from '../deporte/mappers/deporte.mapper';
import { EstadoTorneo } from '../torneo/entities/estado-torneo.enum';
import { Inscripcion } from '../torneo/entities/inscripcion.entity';
import { EquipoDeporte } from './entities/equipo-deporte.entity';
import { Equipo } from './entities/equipo.entity';
import { EquipoMapper } from './mappers/equipo.mapper';

@Injectable()
export class EquipoDeporteService {
  constructor(
    @InjectRepository(Equipo)
    private readonly equipoRepository: Repository<Equipo>,
    @InjectRepository(Deporte)
    private readonly deporteRepository: Repository<Deporte>,
    @InjectRepository(EquipoDeporte)
    private readonly asociaciones: Repository<EquipoDeporte>,
    @InjectRepository(Inscripcion)
    private readonly inscripciones: Repository<Inscripcion>,
  ) {}

  async asociar(
    equipoId: number,
    deporteId: number,
  ): Promise<DeporteResumenDto> {
    const equipo = await this.buscarEquipoExistente(equipoId);
    const deporte = await this.buscarDeporteExistente(deporteId);
    if (!equipo.activo) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `El equipo '${equipo.nombre}' está inactivo`,
      );
    }
    if (!deporte.activo) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `El deporte '${deporte.nombre}' está inactivo`,
      );
    }
    if (
      await this.asociaciones.existsBy({
        equipo: { id: equipoId },
        deporte: { id: deporteId },
      })
    ) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        'El equipo ya está asociado a este deporte',
      );
    }
    const asociacion = this.asociaciones.create({ equipo, deporte });
    await this.asociaciones.save(asociacion);
    return DeporteMapper.aResumen(deporte);
  }

  async deportes(equipoId: number): Promise<DeporteResumenDto[]> {
    await this.buscarEquipoExistente(equipoId);
    const filas = await this.asociaciones.find({
      where: { equipo: { id: equipoId } },
      relations: { deporte: true },
      order: { deporte: { nombre: 'ASC' } },
    });
    return filas.map((fila) => DeporteMapper.aResumen(fila.deporte));
  }

  async equipos(deporteId: number): Promise<EquipoResumenDto[]> {
    await this.buscarDeporteExistente(deporteId);
    const filas = await this.asociaciones.find({
      where: { deporte: { id: deporteId } },
      relations: { equipo: true },
      order: { equipo: { nombre: 'ASC' } },
    });
    return filas.map((fila) => EquipoMapper.aResumen(fila.equipo));
  }

  async retirar(equipoId: number, deporteId: number): Promise<void> {
    const asociacion = await this.asociaciones.findOne({
      where: { equipo: { id: equipoId }, deporte: { id: deporteId } },
      relations: { equipo: true, deporte: true },
    });
    if (!asociacion) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        'La asociación entre el equipo y el deporte no existe',
      );
    }
    const inscripciones = await this.inscripciones.find({
      where: {
        equipo: { id: equipoId },
        torneo: { deporte: { id: deporteId } },
      },
      relations: { torneo: true },
    });
    if (
      inscripciones.some(
        (item) =>
          item.torneo.estado !== EstadoTorneo.FINALIZADO &&
          item.torneo.estado !== EstadoTorneo.CANCELADO,
      )
    ) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        'No se puede retirar la asociación mientras exista un torneo activo de ese deporte',
      );
    }
    await this.asociaciones.remove(asociacion);
  }

  private async buscarEquipoExistente(id: number): Promise<Equipo> {
    const equipo = await this.equipoRepository.findOneBy({ id });
    if (!equipo) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe el equipo con id ${id}`,
      );
    }
    return equipo;
  }

  private async buscarDeporteExistente(id: number): Promise<Deporte> {
    const deporte = await this.deporteRepository.findOneBy({ id });
    if (!deporte) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe el deporte con id ${id}`,
      );
    }
    return deporte;
  }
}
