import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
import { hoyBogota } from '../common/utils/fechas';
import { EquipoDeporte } from '../equipo/entities/equipo-deporte.entity';
import { Equipo } from '../equipo/entities/equipo.entity';
import { CrearInscripcionesDto } from './dto/crear-inscripciones.dto';
import { InscripcionResponseDto } from './dto/inscripcion-response.dto';
import { EstadoTorneo } from './entities/estado-torneo.enum';
import { Inscripcion } from './entities/inscripcion.entity';
import { Torneo } from './entities/torneo.entity';
import { InscripcionMapper } from './mappers/inscripcion.mapper';

@Injectable()
export class InscripcionService {
  constructor(
    @InjectRepository(Torneo) private readonly torneos: Repository<Torneo>,
    @InjectRepository(Equipo) private readonly equipos: Repository<Equipo>,
    @InjectRepository(Inscripcion) private readonly inscripciones: Repository<Inscripcion>,
    @InjectRepository(EquipoDeporte) private readonly asociaciones: Repository<EquipoDeporte>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async inscribir(torneoId: number, dto: CrearInscripcionesDto): Promise<InscripcionResponseDto[]> {
    const torneo = await this.torneos.findOne({ where: { id: torneoId }, relations: { deporte: true } });
    if (!torneo) throw new ApplicationException(ErrorCase.NOT_FOUND, `No existe el torneo con id ${torneoId}`);
    if (torneo.estado !== EstadoTorneo.INSCRIPCIONES_ABIERTAS || hoyBogota() > torneo.fechaCierreInscripciones) throw new ApplicationException(ErrorCase.INVALID_OPERATION, 'Las inscripciones del torneo no están abiertas');
    const creadas: InscripcionResponseDto[] = [];
    await this.dataSource.transaction(async (manager) => {
      for (const equipoId of [...new Set(dto.equipoIds)]) {
        const equipo = await manager.getRepository(Equipo).findOneBy({ id: equipoId });
        if (!equipo) throw new ApplicationException(ErrorCase.NOT_FOUND, `No existe el equipo con id ${equipoId}`);
        if (!equipo.activo) throw new ApplicationException(ErrorCase.INVALID_OPERATION, `El equipo '${equipo.nombre}' está inactivo`);
        if (!await manager.getRepository(EquipoDeporte).existsBy({ equipo: { id: equipoId }, deporte: { id: torneo.deporte.id } })) throw new ApplicationException(ErrorCase.INVALID_OPERATION, `El equipo '${equipo.nombre}' no está asociado al deporte del torneo`);
        if (await manager.getRepository(Inscripcion).existsBy({ torneo: { id: torneoId }, equipo: { id: equipoId } })) throw new ApplicationException(ErrorCase.ALREADY_EXISTS, `El equipo '${equipo.nombre}' ya está inscrito en el torneo`);
        const cantidad = await manager.getRepository(Inscripcion).countBy({ torneo: { id: torneoId } });
        if (torneo.maxEquipos && cantidad >= torneo.maxEquipos) throw new ApplicationException(ErrorCase.INVALID_OPERATION, 'El torneo ya alcanzó el máximo de equipos');
        const inscripcion = manager.getRepository(Inscripcion).create({ torneo, equipo });
        await manager.getRepository(Inscripcion).save(inscripcion);
        creadas.push(InscripcionMapper.aResponse({ ...inscripcion, torneo, equipo }));
      }
    });
    return creadas;
  }
  async listarTorneo(torneoId: number): Promise<InscripcionResponseDto[]> {
    await this.buscarTorneo(torneoId);
    const filas = await this.inscripciones.find({ where: { torneo: { id: torneoId } }, relations: { torneo: true, equipo: true }, order: { equipo: { nombre: 'ASC' } } });
    return filas.map((fila) => InscripcionMapper.aResponse(fila));
  }
  async listarEquipo(equipoId: number): Promise<InscripcionResponseDto[]> {
    if (!await this.equipos.existsBy({ id: equipoId })) throw new ApplicationException(ErrorCase.NOT_FOUND, `No existe el equipo con id ${equipoId}`);
    const filas = await this.inscripciones.find({ where: { equipo: { id: equipoId } }, relations: { torneo: true, equipo: true }, order: { torneo: { nombre: 'ASC' } } });
    return filas.map((fila) => InscripcionMapper.aResponse(fila));
  }
  async retirar(torneoId: number, equipoId: number): Promise<void> {
    const torneo = await this.buscarTorneo(torneoId);
    if (torneo.estado !== EstadoTorneo.INSCRIPCIONES_ABIERTAS || hoyBogota() > torneo.fechaCierreInscripciones) throw new ApplicationException(ErrorCase.INVALID_OPERATION, 'Las inscripciones del torneo no están abiertas');
    const inscripcion = await this.inscripciones.findOne({ where: { torneo: { id: torneoId }, equipo: { id: equipoId } }, relations: { torneo: true, equipo: true } });
    if (!inscripcion) throw new ApplicationException(ErrorCase.NOT_FOUND, 'El equipo no está inscrito en el torneo');
    await this.inscripciones.remove(inscripcion);
  }
  private async buscarTorneo(id: number): Promise<Torneo> {
    const torneo = await this.torneos.findOne({ where: { id }, relations: { deporte: true } });
    if (!torneo) throw new ApplicationException(ErrorCase.NOT_FOUND, `No existe el torneo con id ${id}`);
    return torneo;
  }
}
