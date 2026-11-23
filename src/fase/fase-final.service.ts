import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Not, Repository } from 'typeorm';
// TODO: verificar rutas cuando A suba common/errores (ACUERDOS 5.3 y 13.1)
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
// Entidades AJENAS: SOLO lectura (ACUERDOS 7 y 13.3). Nunca save/update/delete ni inyectar sus services.
// TODO: Torneo y EstadoTorneo son de A (compilan cuando A suba torneo/entities)
import { Partido } from '../partido/entities/partido.entity';
import { EstadoTorneo } from '../torneo/entities/estado-torneo.enum';
import { Torneo } from '../torneo/entities/torneo.entity';
import { ActualizarFaseFinalDto } from './dto/actualizar-fase-final.dto';
import {
  CrearFaseFinalDto,
  esCantidadEquiposValida,
} from './dto/crear-fase-final.dto';
import { FaseResponseDto } from './dto/fase-response.dto';
import { LlavesResponseDto } from './dto/llaves-response.dto';
import { Fase, FaseFinal, Grupo } from './entities/fase.entity';
import { RondaFinal } from './entities/ronda-final.enum';
import { FaseFinalMapper } from './mappers/fase-final.mapper';
import { FaseMapper } from './mappers/fase.mapper';
import { construirRondasLlaves } from './utils/llaves-fase-final';

// HU-GC-05 · ACUERDOS 6.11, 7 y 9.16. Gestión de fases finales y consulta de cuadro de llaves.
@Injectable()
export class FaseFinalService {
  constructor(
    @InjectRepository(FaseFinal)
    private readonly faseFinalRepository: Repository<FaseFinal>,
    @InjectRepository(Fase)
    private readonly faseRepository: Repository<Fase>,
    @InjectRepository(Grupo)
    private readonly grupoRepository: Repository<Grupo>,
    // De A, solo lectura.
    @InjectRepository(Torneo)
    private readonly torneoRepository: Repository<Torneo>,
    // De B, solo lectura.
    @InjectRepository(Partido)
    private readonly partidoRepository: Repository<Partido>,
  ) {}

  // POST /api/torneos/{torneoId}/fase-final
  async crear(
    torneoId: number,
    dto: CrearFaseFinalDto,
  ): Promise<FaseResponseDto> {
    const torneo = await this.buscarTorneo(torneoId);
    this.validarTorneoModificable(torneo, 'crear');

    const tercerPuesto = dto.tercerPuesto ?? false;
    this.validarConfiguracion(dto.cantidadEquipos, tercerPuesto);

    const yaExisteFaseFinal = await this.faseFinalRepository.existsBy({
      torneo: { id: torneoId },
    });
    if (yaExisteFaseFinal) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `El torneo '${torneo.nombre}' ya tiene una fase final registrada`,
      );
    }

    const nombreLimpio = dto.nombre.trim();
    const nombreDuplicado = await this.faseRepository.existsBy({
      torneo: { id: torneoId },
      nombre: nombreLimpio,
    });
    if (nombreDuplicado) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `Ya existe una fase con el nombre '${nombreLimpio}' en el torneo '${torneo.nombre}'`,
      );
    }

    await this.validarOrdenMayorQueGrupos(torneoId, dto.orden);

    const nuevaFaseFinal = this.faseFinalRepository.create({
      torneo,
      nombre: nombreLimpio,
      orden: dto.orden,
      cantidadEquipos: dto.cantidadEquipos,
      tercerPuesto,
    });
    const guardada = await this.faseFinalRepository.save(nuevaFaseFinal);
    guardada.torneo = torneo;

    return FaseMapper.aResponse(guardada, 0);
  }

  // GET /api/torneos/{torneoId}/fase-final
  async obtenerPorTorneo(torneoId: number): Promise<FaseResponseDto> {
    const torneo = await this.buscarTorneo(torneoId);

    const faseFinal = await this.faseFinalRepository.findOne({
      where: { torneo: { id: torneoId } },
      relations: { torneo: true },
    });
    if (!faseFinal) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `El torneo '${torneo.nombre}' no tiene una fase final registrada`,
      );
    }

    const cantidadPartidos = await this.partidoRepository.countBy({
      fase: { id: faseFinal.id },
    });
    return FaseMapper.aResponse(faseFinal, cantidadPartidos);
  }

  // PUT /api/fases-finales/{id}
  async actualizar(
    id: number,
    dto: ActualizarFaseFinalDto,
  ): Promise<FaseResponseDto> {
    const faseFinal = await this.buscarFaseFinal(id);
    this.validarTorneoModificable(faseFinal.torneo, 'modificar');

    const tercerPuesto = dto.tercerPuesto ?? false;
    this.validarConfiguracion(dto.cantidadEquipos, tercerPuesto);

    if (dto.cantidadEquipos !== faseFinal.cantidadEquipos) {
      const tienePartidos = await this.partidoRepository.existsBy({
        fase: { id: faseFinal.id },
      });
      if (tienePartidos) {
        throw new ApplicationException(
          ErrorCase.INVALID_OPERATION,
          `No se puede cambiar la cantidad de equipos de la fase final '${faseFinal.nombre}' porque ya tiene partidos registrados`,
        );
      }
    }

    if (Boolean(faseFinal.tercerPuesto) && !tercerPuesto) {
      const tienePartidosTercerPuesto = await this.partidoRepository.existsBy({
        fase: { id: faseFinal.id },
        ronda: RondaFinal.TERCER_PUESTO,
      });
      if (tienePartidosTercerPuesto) {
        throw new ApplicationException(
          ErrorCase.INVALID_OPERATION,
          `No se puede deshabilitar el partido por el tercer puesto en la fase final '${faseFinal.nombre}' porque ya tiene partidos registrados en esa ronda`,
        );
      }
    }

    const nombreLimpio = dto.nombre.trim();
    const nombreDuplicado = await this.faseRepository.existsBy({
      torneo: { id: faseFinal.torneo.id },
      nombre: nombreLimpio,
      id: Not(faseFinal.id),
    });
    if (nombreDuplicado) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `Ya existe una fase con el nombre '${nombreLimpio}' en el torneo '${faseFinal.torneo.nombre}'`,
      );
    }

    if (dto.orden !== faseFinal.orden) {
      await this.validarOrdenMayorQueGrupos(faseFinal.torneo.id, dto.orden);
    }

    faseFinal.nombre = nombreLimpio;
    faseFinal.orden = dto.orden;
    faseFinal.cantidadEquipos = dto.cantidadEquipos;
    faseFinal.tercerPuesto = tercerPuesto;

    await this.faseFinalRepository.save(faseFinal);

    const cantidadPartidos = await this.partidoRepository.countBy({
      fase: { id: faseFinal.id },
    });
    return FaseMapper.aResponse(faseFinal, cantidadPartidos);
  }

  // DELETE /api/fases-finales/{id}
  async eliminar(id: number): Promise<void> {
    const faseFinal = await this.buscarFaseFinal(id);
    this.validarTorneoModificable(faseFinal.torneo, 'eliminar');

    const cantidadPartidos = await this.partidoRepository.countBy({
      fase: { id },
    });
    if (cantidadPartidos > 0) {
      throw new ApplicationException(
        ErrorCase.HAS_ASSOCIATIONS,
        `No se puede eliminar la fase final '${faseFinal.nombre}' porque tiene ${cantidadPartidos} partido(s) asociado(s)`,
      );
    }

    await this.faseFinalRepository.remove(faseFinal);
  }

  // GET /api/fases-finales/{id}/llaves
  async obtenerLlaves(id: number): Promise<LlavesResponseDto> {
    const faseFinal = await this.buscarFaseFinal(id);

    const partidos = await this.partidoRepository.find({
      where: { fase: { id } },
      relations: { equipoLocal: true, equipoVisitante: true },
      order: { fechaHora: 'ASC', id: 'ASC' },
    });

    const rondas = construirRondasLlaves(
      faseFinal.cantidadEquipos,
      Boolean(faseFinal.tercerPuesto),
      partidos,
    );

    return FaseFinalMapper.aLlavesResponse(faseFinal, rondas);
  }

  private async buscarTorneo(torneoId: number): Promise<Torneo> {
    const torneo = await this.torneoRepository.findOneBy({ id: torneoId });
    if (!torneo) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe el torneo con id ${torneoId}`,
      );
    }
    return torneo;
  }

  private async buscarFaseFinal(id: number): Promise<FaseFinal> {
    const faseFinal = await this.faseFinalRepository.findOne({
      where: { id },
      relations: { torneo: true },
    });
    if (!faseFinal) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe la fase final con id ${id}`,
      );
    }
    return faseFinal;
  }

  private validarTorneoModificable(
    torneo: Torneo,
    accion: 'crear' | 'modificar' | 'eliminar',
  ): void {
    if (
      torneo.estado === EstadoTorneo.FINALIZADO ||
      torneo.estado === EstadoTorneo.CANCELADO
    ) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `No se puede ${accion} la fase final porque el torneo '${torneo.nombre}' está ${torneo.estado}`,
      );
    }
  }

  // Reglas de configuración de fase final (ACUERDOS 6.11 y consistencia con Persona B):
  // - cantidadEquipos ∈ {2, 4, 8, 16, 32} (validado también en DTO).
  // - tercerPuesto requiere al menos 4 equipos (perdedores de semifinales).
  private validarConfiguracion(
    cantidadEquipos: number,
    tercerPuesto: boolean,
  ): void {
    if (!esCantidadEquiposValida(cantidadEquipos)) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `La cantidad de equipos de la fase final debe ser 2, 4, 8, 16 o 32 (recibido: ${cantidadEquipos})`,
      );
    }

    if (cantidadEquipos === 2 && tercerPuesto) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        'No se puede habilitar el partido por el tercer puesto en una fase final de 2 equipos (requiere al menos 4 equipos)',
      );
    }
  }

  private async validarOrdenMayorQueGrupos(
    torneoId: number,
    orden: number,
  ): Promise<void> {
    const existeGrupoMayorOIgual = await this.grupoRepository.existsBy({
      torneo: { id: torneoId },
      orden: MoreThanOrEqual(orden),
    });
    if (existeGrupoMayorOIgual) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `El orden de la fase final (${orden}) debe ser mayor que el de todos los grupos del torneo`,
      );
    }
  }
}
