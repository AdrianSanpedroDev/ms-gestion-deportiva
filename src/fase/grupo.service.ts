import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, Repository } from 'typeorm';
// TODO: verificar rutas cuando A suba common/dto y common/errores (ACUERDOS 5.3, 5.6 y 13.1)
import type { EquipoResumen } from '../common/dto/equipo-resumen.dto';
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
// Entidades AJENAS: SOLO lectura (ACUERDOS 7 y 13.3). Nunca save/update/delete ni inyectar sus services.
// TODO: Equipo, Torneo, EstadoTorneo e Inscripcion son de A (compilan cuando A suba sus entidades)
import { Equipo } from '../equipo/entities/equipo.entity';
import { EstadoPartido } from '../partido/entities/estado-partido.enum';
import { Partido } from '../partido/entities/partido.entity';
import { EstadoTorneo } from '../torneo/entities/estado-torneo.enum';
import { Inscripcion } from '../torneo/entities/inscripcion.entity';
import { Torneo } from '../torneo/entities/torneo.entity';
import { ActualizarGrupoDto } from './dto/actualizar-grupo.dto';
import { AsignarEquiposGrupoDto } from './dto/asignar-equipos-grupo.dto';
import { CrearGrupoDto } from './dto/crear-grupo.dto';
import { FilaPosicionDto } from './dto/fila-posicion.dto';
import { FiltrosGrupoDto } from './dto/filtros-grupo.dto';
import { GrupoResponseDto } from './dto/grupo-response.dto';
import { Fase, FaseFinal, Grupo } from './entities/fase.entity';
import { GrupoEquipo } from './entities/grupo-equipo.entity';
import { GrupoMapper } from './mappers/grupo.mapper';
import { FaseRepository } from './repositories/fase.repository';
import { calcularTablaPosiciones } from './utils/tabla-posiciones';

// HU-GC-04 · ACUERDOS 6.11, 7 y 9.15. Gestión de grupos de competencia, asignación de equipos y tabla de posiciones.
@Injectable()
export class GrupoService {
  constructor(
    @InjectRepository(Grupo)
    private readonly grupoRepository: Repository<Grupo>,
    @InjectRepository(Fase)
    private readonly faseRepository: Repository<Fase>,
    @InjectRepository(FaseFinal)
    private readonly faseFinalRepository: Repository<FaseFinal>,
    @InjectRepository(GrupoEquipo)
    private readonly grupoEquipoRepository: Repository<GrupoEquipo>,
    private readonly faseSqlRepository: FaseRepository,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    // De A, solo lectura.
    @InjectRepository(Torneo)
    private readonly torneoRepository: Repository<Torneo>,
    @InjectRepository(Equipo)
    private readonly equipoRepository: Repository<Equipo>,
    @InjectRepository(Inscripcion)
    private readonly inscripcionRepository: Repository<Inscripcion>,
    // De B, solo lectura.
    @InjectRepository(Partido)
    private readonly partidoRepository: Repository<Partido>,
  ) {}

  // POST /api/torneos/{torneoId}/grupos
  async crear(torneoId: number, dto: CrearGrupoDto): Promise<GrupoResponseDto> {
    const torneo = await this.buscarTorneo(torneoId);
    this.validarTorneoModificable(torneo, 'crear');

    const nombreLimpio = dto.nombre.trim();
    const duplicado = await this.faseRepository.existsBy({
      torneo: { id: torneoId },
      nombre: nombreLimpio,
    });
    if (duplicado) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `Ya existe una fase con el nombre '${nombreLimpio}' en el torneo '${torneo.nombre}'`,
      );
    }

    await this.validarOrdenMenorQueFaseFinal(torneoId, dto.orden);

    const nuevoGrupo = this.grupoRepository.create({
      torneo,
      nombre: nombreLimpio,
      orden: dto.orden,
    });
    const guardado = await this.grupoRepository.save(nuevoGrupo);
    guardado.torneo = torneo;

    return GrupoMapper.aResponse(guardado, []);
  }

  // GET /api/torneos/{torneoId}/grupos?orden=
  async listarPorTorneo(
    torneoId: number,
    filtros: FiltrosGrupoDto = {},
  ): Promise<GrupoResponseDto[]> {
    await this.buscarTorneo(torneoId);

    const grupos = await this.grupoRepository.find({
      where: {
        torneo: { id: torneoId },
        ...(filtros.orden !== undefined ? { orden: filtros.orden } : {}),
      },
      relations: { torneo: true },
      order: { orden: 'ASC', nombre: 'ASC', id: 'ASC' },
    });

    if (grupos.length === 0) {
      return [];
    }

    const grupoIds = grupos.map((grupo) => grupo.id);
    const asignaciones = await this.grupoEquipoRepository.find({
      where: { grupo: { id: In(grupoIds) } },
      relations: { grupo: true, equipo: true },
    });

    const equiposPorGrupo = new Map<number, Equipo[]>();
    for (const asignacion of asignaciones) {
      const lista = equiposPorGrupo.get(asignacion.grupo.id) ?? [];
      lista.push(asignacion.equipo);
      equiposPorGrupo.set(asignacion.grupo.id, lista);
    }

    return grupos.map((grupo) =>
      GrupoMapper.aResponse(grupo, equiposPorGrupo.get(grupo.id) ?? []),
    );
  }

  // GET /api/grupos/{id}
  async obtener(id: number): Promise<GrupoResponseDto> {
    const grupo = await this.buscarGrupo(id);
    const equipos = await this.obtenerEquiposDeGrupo(id);
    return GrupoMapper.aResponse(grupo, equipos);
  }

  // PUT /api/grupos/{id}
  async actualizar(
    id: number,
    dto: ActualizarGrupoDto,
  ): Promise<GrupoResponseDto> {
    const grupo = await this.buscarGrupo(id);
    this.validarTorneoModificable(grupo.torneo, 'modificar');

    const nombreLimpio = dto.nombre.trim();
    const duplicado = await this.faseRepository.existsBy({
      torneo: { id: grupo.torneo.id },
      nombre: nombreLimpio,
      id: Not(grupo.id),
    });
    if (duplicado) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `Ya existe una fase con el nombre '${nombreLimpio}' en el torneo '${grupo.torneo.nombre}'`,
      );
    }

    if (dto.orden !== grupo.orden) {
      await this.validarOrdenMenorQueFaseFinal(grupo.torneo.id, dto.orden);

      const hayConflictoEquipo =
        await this.faseSqlRepository.existeConflictoEquipoEnOrden(
          grupo.id,
          grupo.torneo.id,
          dto.orden,
        );
      if (hayConflictoEquipo) {
        throw new ApplicationException(
          ErrorCase.ALREADY_EXISTS,
          `No se puede cambiar el orden del grupo a ${dto.orden} porque al menos uno de sus equipos ya está en otro grupo de este torneo con el mismo orden`,
        );
      }
    }

    grupo.nombre = nombreLimpio;
    grupo.orden = dto.orden;

    await this.grupoRepository.save(grupo);
    const equipos = await this.obtenerEquiposDeGrupo(grupo.id);
    return GrupoMapper.aResponse(grupo, equipos);
  }

  // DELETE /api/grupos/{id}
  // Al eliminar un Grupo, MySQL elimina en cascada sus filas de grupo_equipo sin tocar Equipo ni Torneo.
  async eliminar(id: number): Promise<void> {
    const grupo = await this.buscarGrupo(id);
    this.validarTorneoModificable(grupo.torneo, 'eliminar');

    const cantidadPartidos = await this.partidoRepository.countBy({
      fase: { id },
    });
    if (cantidadPartidos > 0) {
      throw new ApplicationException(
        ErrorCase.HAS_ASSOCIATIONS,
        `No se puede eliminar el grupo '${grupo.nombre}' porque tiene ${cantidadPartidos} partido(s) asociado(s)`,
      );
    }

    await this.grupoRepository.remove(grupo);
  }

  // POST /api/grupos/{grupoId}/equipos (transacción todo-o-nada, ACUERDOS 5.4 y 9.15)
  // Retorna únicamente los equipos recién asignados en esta petición.
  async asignarEquipos(
    grupoId: number,
    dto: AsignarEquiposGrupoDto,
  ): Promise<EquipoResumen[]> {
    return this.dataSource.transaction(async (manager) => {
      const grupoRepo = manager.getRepository(Grupo);
      const equipoRepo = manager.getRepository(Equipo);
      const inscripcionRepo = manager.getRepository(Inscripcion);
      const grupoEquipoRepo = manager.getRepository(GrupoEquipo);

      const grupo = await grupoRepo.findOne({
        where: { id: grupoId },
        relations: { torneo: true },
      });
      if (!grupo) {
        throw new ApplicationException(
          ErrorCase.NOT_FOUND,
          `No existe el grupo con id ${grupoId}`,
        );
      }
      this.validarTorneoModificable(grupo.torneo, 'modificar');

      const asignacionesEnMismoOrden = await grupoEquipoRepo.find({
        where: {
          equipo: { id: In(dto.equipoIds) },
          grupo: { torneo: { id: grupo.torneo.id }, orden: grupo.orden },
        },
        relations: { grupo: true, equipo: true },
      });
      const conflictoPorEquipoId = new Map<number, Grupo>();
      for (const asignacion of asignacionesEnMismoOrden) {
        conflictoPorEquipoId.set(asignacion.equipo.id, asignacion.grupo);
      }

      const equiposValidados: Equipo[] = [];

      for (const equipoId of dto.equipoIds) {
        const equipo = await equipoRepo.findOneBy({ id: equipoId });
        if (!equipo) {
          throw new ApplicationException(
            ErrorCase.NOT_FOUND,
            `No existe el equipo con id ${equipoId}`,
          );
        }

        if (!equipo.activo) {
          throw new ApplicationException(
            ErrorCase.INVALID_OPERATION,
            `No se puede asignar el equipo '${equipo.nombre}' porque está inactivo`,
          );
        }

        const estaInscrito = await inscripcionRepo.existsBy({
          torneo: { id: grupo.torneo.id },
          equipo: { id: equipoId },
        });
        if (!estaInscrito) {
          throw new ApplicationException(
            ErrorCase.INVALID_OPERATION,
            `El equipo '${equipo.nombre}' no está inscrito en el torneo '${grupo.torneo.nombre}'`,
          );
        }

        const grupoConflicto = conflictoPorEquipoId.get(equipoId);
        if (grupoConflicto) {
          if (grupoConflicto.id === grupo.id) {
            throw new ApplicationException(
              ErrorCase.ALREADY_EXISTS,
              `El equipo '${equipo.nombre}' ya está asignado al grupo '${grupo.nombre}'`,
            );
          }
          throw new ApplicationException(
            ErrorCase.ALREADY_EXISTS,
            `El equipo '${equipo.nombre}' ya está asignado al grupo '${grupoConflicto.nombre}' del torneo '${grupo.torneo.nombre}' con el mismo orden (${grupo.orden})`,
          );
        }

        equiposValidados.push(equipo);
      }

      const nuevosRegistros = equiposValidados.map((equipo) =>
        grupoEquipoRepo.create({ grupo, equipo }),
      );
      await grupoEquipoRepo.save(nuevosRegistros);

      return GrupoMapper.ordenarEquipos(equiposValidados).map((equipo) =>
        GrupoMapper.aEquipoResumen(equipo),
      );
    });
  }

  // GET /api/grupos/{grupoId}/equipos
  async listarEquipos(grupoId: number): Promise<EquipoResumen[]> {
    await this.buscarGrupo(grupoId);
    const equipos = await this.obtenerEquiposDeGrupo(grupoId);
    return GrupoMapper.ordenarEquipos(equipos).map((equipo) =>
      GrupoMapper.aEquipoResumen(equipo),
    );
  }

  // DELETE /api/grupos/{grupoId}/equipos/{equipoId}
  async retirarEquipo(grupoId: number, equipoId: number): Promise<void> {
    const grupo = await this.buscarGrupo(grupoId);
    this.validarTorneoModificable(grupo.torneo, 'modificar');

    const asignacion = await this.grupoEquipoRepository.findOne({
      where: { grupo: { id: grupoId }, equipo: { id: equipoId } },
      relations: { equipo: true },
    });
    if (!asignacion) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `El equipo con id ${equipoId} no está asignado al grupo '${grupo.nombre}'`,
      );
    }

    const tienePartidos = await this.partidoRepository.exists({
      where: [
        { fase: { id: grupoId }, equipoLocal: { id: equipoId } },
        { fase: { id: grupoId }, equipoVisitante: { id: equipoId } },
      ],
    });
    if (tienePartidos) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `No se puede retirar el equipo '${asignacion.equipo.nombre}' del grupo '${grupo.nombre}' porque tiene partidos en este grupo`,
      );
    }

    await this.grupoEquipoRepository.remove(asignacion);
  }

  // GET /api/grupos/{grupoId}/tabla-posiciones
  async obtenerTablaPosiciones(grupoId: number): Promise<FilaPosicionDto[]> {
    await this.buscarGrupo(grupoId);

    const [equipos, partidosFinalizados] = await Promise.all([
      this.obtenerEquiposDeGrupo(grupoId),
      this.partidoRepository.find({
        where: {
          fase: { id: grupoId },
          estado: EstadoPartido.FINALIZADO,
        },
        relations: { equipoLocal: true, equipoVisitante: true },
        order: { fechaHora: 'ASC' },
      }),
    ]);

    return calcularTablaPosiciones(equipos, partidosFinalizados);
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

  private async buscarGrupo(id: number): Promise<Grupo> {
    const grupo = await this.grupoRepository.findOne({
      where: { id },
      relations: { torneo: true },
    });
    if (!grupo) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe el grupo con id ${id}`,
      );
    }
    return grupo;
  }

  private async obtenerEquiposDeGrupo(grupoId: number): Promise<Equipo[]> {
    const asignaciones = await this.grupoEquipoRepository.find({
      where: { grupo: { id: grupoId } },
      relations: { equipo: true },
    });
    return asignaciones.map((asignacion) => asignacion.equipo);
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
        `No se pueden ${accion} grupos porque el torneo '${torneo.nombre}' está ${torneo.estado}`,
      );
    }
  }

  private async validarOrdenMenorQueFaseFinal(
    torneoId: number,
    orden: number,
  ): Promise<void> {
    const faseFinal = await this.faseFinalRepository.findOneBy({
      torneo: { id: torneoId },
    });
    if (faseFinal && orden >= faseFinal.orden) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `El orden del grupo (${orden}) debe ser menor que el de la fase final (${faseFinal.orden})`,
      );
    }
  }
}
