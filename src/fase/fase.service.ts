import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Not, Repository } from 'typeorm';
// TODO: verificar ruta cuando A suba common/errores (ACUERDOS 5.3 y 13.1)
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
// Entidades AJENAS: SOLO lectura (ACUERDOS 7 y 13.3). Nunca save/update/delete ni inyectar sus services.
// TODO: Partido es de B; Torneo y EstadoTorneo son de A (compilan cuando A suba torneo/entities)
import { Partido } from '../partido/entities/partido.entity';
import { EstadoTorneo } from '../torneo/entities/estado-torneo.enum';
import { Torneo } from '../torneo/entities/torneo.entity';
import { ActualizarFaseDto } from './dto/actualizar-fase.dto';
import { FaseResponseDto } from './dto/fase-response.dto';
import { Fase, FaseFinal, Grupo } from './entities/fase.entity';
import { GrupoEquipo } from './entities/grupo-equipo.entity';
import { FaseMapper } from './mappers/fase.mapper';
import { FaseRepository } from './repositories/fase.repository';

// HU-GC-03 · ACUERDOS 6.11, 7 y 9.14. Operaciones comunes sobre fases (Grupo y FaseFinal).
// Fase es abstracta: se crea mediante Grupo (HU-GC-04) o FaseFinal (HU-GC-05).
@Injectable()
export class FaseService {
  constructor(
    @InjectRepository(Fase)
    private readonly faseRepository: Repository<Fase>,
    @InjectRepository(Grupo)
    private readonly grupoRepository: Repository<Grupo>,
    @InjectRepository(FaseFinal)
    private readonly faseFinalRepository: Repository<FaseFinal>,
    @InjectRepository(GrupoEquipo)
    private readonly grupoEquipoRepository: Repository<GrupoEquipo>,
    private readonly faseSqlRepository: FaseRepository,
    // De A, solo lectura.
    @InjectRepository(Torneo)
    private readonly torneoRepository: Repository<Torneo>,
    // De B, solo lectura.
    @InjectRepository(Partido)
    private readonly partidoRepository: Repository<Partido>,
  ) {}

  // GET /api/torneos/{torneoId}/fases (ordenado por orden ASC, luego nombre ASC)
  async listarPorTorneo(torneoId: number): Promise<FaseResponseDto[]> {
    await this.buscarTorneo(torneoId);

    const fases = await this.faseRepository.find({
      where: { torneo: { id: torneoId } },
      relations: { torneo: true },
      order: { orden: 'ASC', nombre: 'ASC', id: 'ASC' },
    });

    if (fases.length === 0) {
      return [];
    }

    const faseIds = fases.map((fase) => fase.id);
    const grupoIds = fases
      .filter((fase): fase is Grupo => fase instanceof Grupo)
      .map((grupo) => grupo.id);

    const [conteoPartidos, conteoEquipos] = await Promise.all([
      this.faseSqlRepository.contarPartidosPorFase(faseIds),
      this.faseSqlRepository.contarEquiposPorGrupo(grupoIds),
    ]);

    return fases.map((fase) =>
      FaseMapper.aResponse(
        fase,
        conteoPartidos.get(fase.id) ?? 0,
        fase instanceof Grupo ? (conteoEquipos.get(fase.id) ?? 0) : 0,
      ),
    );
  }

  // GET /api/fases/{id}
  async obtener(id: number): Promise<FaseResponseDto> {
    const fase = await this.buscarFase(id);
    return this.aResponseConConteos(fase);
  }

  // PATCH /api/fases/{id}
  async actualizar(
    id: number,
    dto: ActualizarFaseDto,
  ): Promise<FaseResponseDto> {
    if (dto.nombre === undefined && dto.orden === undefined) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        'Debe enviar al menos un campo para actualizar (nombre u orden)',
      );
    }

    const fase = await this.buscarFase(id);
    this.validarTorneoModificable(fase.torneo, 'modificar');

    if (dto.nombre !== undefined) {
      const nombreLimpio = dto.nombre.trim();
      const duplicado = await this.faseRepository.existsBy({
        torneo: { id: fase.torneo.id },
        nombre: nombreLimpio,
        id: Not(fase.id),
      });
      if (duplicado) {
        throw new ApplicationException(
          ErrorCase.ALREADY_EXISTS,
          `Ya existe una fase con el nombre '${nombreLimpio}' en el torneo '${fase.torneo.nombre}'`,
        );
      }
      fase.nombre = nombreLimpio;
    }

    if (dto.orden !== undefined && dto.orden !== fase.orden) {
      await this.validarNuevoOrden(fase, dto.orden);
      fase.orden = dto.orden;
    }

    await this.faseRepository.save(fase);
    return this.aResponseConConteos(fase);
  }

  // DELETE /api/fases/{id}
  // Al eliminar un Grupo, MySQL elimina en cascada sus filas de grupo_equipo sin tocar Equipo ni Torneo.
  async eliminar(id: number): Promise<void> {
    const fase = await this.buscarFase(id);
    this.validarTorneoModificable(fase.torneo, 'eliminar');

    const cantidadPartidos = await this.partidoRepository.countBy({
      fase: { id },
    });
    if (cantidadPartidos > 0) {
      throw new ApplicationException(
        ErrorCase.HAS_ASSOCIATIONS,
        `No se puede eliminar la fase '${fase.nombre}' porque tiene ${cantidadPartidos} partido(s) asociado(s)`,
      );
    }

    await this.faseRepository.remove(fase);
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

  private async buscarFase(id: number): Promise<Fase> {
    const fase = await this.faseRepository.findOne({
      where: { id },
      relations: { torneo: true },
    });
    if (!fase) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe la fase con id ${id}`,
      );
    }
    return fase;
  }

  private validarTorneoModificable(
    torneo: Torneo,
    accion: 'modificar' | 'eliminar',
  ): void {
    if (
      torneo.estado === EstadoTorneo.FINALIZADO ||
      torneo.estado === EstadoTorneo.CANCELADO
    ) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `No se pueden ${accion} fases porque el torneo '${torneo.nombre}' está ${torneo.estado}`,
      );
    }
  }

  // Reglas de orden (ACUERDOS 6.11):
  // - FaseFinal siempre debe tener orden > orden de todos los grupos del torneo.
  // - Un Grupo no puede tener orden >= orden de la FaseFinal (si existe).
  // - Al cambiar el orden de un Grupo, ningún equipo suyo puede coincidir en otro grupo con ese mismo orden.
  private async validarNuevoOrden(
    fase: Fase,
    nuevoOrden: number,
  ): Promise<void> {
    const torneoId = fase.torneo.id;

    if (fase instanceof FaseFinal) {
      const existeGrupoMayorOIgual = await this.grupoRepository.existsBy({
        torneo: { id: torneoId },
        orden: MoreThanOrEqual(nuevoOrden),
      });
      if (existeGrupoMayorOIgual) {
        throw new ApplicationException(
          ErrorCase.INVALID_OPERATION,
          `El orden de la fase final (${nuevoOrden}) debe ser mayor que el de todos los grupos del torneo`,
        );
      }
      return;
    }

    const faseFinal = await this.faseFinalRepository.findOneBy({
      torneo: { id: torneoId },
    });
    if (faseFinal && nuevoOrden >= faseFinal.orden) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `El orden del grupo (${nuevoOrden}) debe ser menor que el de la fase final (${faseFinal.orden})`,
      );
    }

    const hayConflictoEquipo =
      await this.faseSqlRepository.existeConflictoEquipoEnOrden(
        fase.id,
        torneoId,
        nuevoOrden,
      );
    if (hayConflictoEquipo) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `No se puede cambiar el orden del grupo a ${nuevoOrden} porque al menos uno de sus equipos ya está en otro grupo de este torneo con el mismo orden`,
      );
    }
  }

  private async aResponseConConteos(fase: Fase): Promise<FaseResponseDto> {
    const cantidadPartidos = await this.partidoRepository.countBy({
      fase: { id: fase.id },
    });
    const cantidadEquiposGrupo =
      fase instanceof Grupo
        ? await this.grupoEquipoRepository.countBy({ grupo: { id: fase.id } })
        : 0;

    return FaseMapper.aResponse(fase, cantidadPartidos, cantidadEquiposGrupo);
  }
}
