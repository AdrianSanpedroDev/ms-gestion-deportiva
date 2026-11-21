import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsRelations,
  FindOptionsWhere,
  Not,
  Repository,
} from 'typeorm';
// TODO: ajustar la ruta cuando A suba common/errores
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
// TODO: ajustar la ruta cuando A suba common/notificacion (NotificacionModule @Global, sección 8)
import { CorreoService } from '../common/notificacion/correo.service';
import { DestinatariosService } from '../common/notificacion/destinatarios.service';
// Entidades AJENAS, solo lectura (ACUERDOS 7): findOne*, existsBy. Nunca save/remove ni su Service.
// TODO: Equipo, Escenario, Inscripcion, Torneo y EstadoTorneo son de A; compilan cuando A los suba
import { Equipo } from '../equipo/entities/equipo.entity';
import { Escenario } from '../escenario/entities/escenario.entity';
import { EstadoTorneo } from '../torneo/entities/estado-torneo.enum';
import { Inscripcion } from '../torneo/entities/inscripcion.entity';
import type { Torneo } from '../torneo/entities/torneo.entity';
// TODO: Fase, Grupo, FaseFinal, GrupoEquipo y RondaFinal son de C; compilan cuando C los suba
import { Fase, FaseFinal, Grupo } from '../fase/entities/fase.entity';
import { GrupoEquipo } from '../fase/entities/grupo-equipo.entity';
import type { RondaFinal } from '../fase/entities/ronda-final.enum';
import { JugadorMapper } from '../jugador/mappers/jugador.mapper';
import { aFechaHoraIso } from '../jugador/utils/fechas';
import { ActualizarPartidoDto } from './dto/actualizar-partido.dto';
import { CrearPartidoDto } from './dto/crear-partido.dto';
import { FiltrosPartidoFaseDto } from './dto/filtros-partido-fase.dto';
import { FiltrosPartidoDto } from './dto/filtros-partido.dto';
import { PartidoResponseDto } from './dto/partido-response.dto';
import { ResultadoDto } from './dto/resultado.dto';
import { Anotacion } from './entities/anotacion.entity';
import {
  admiteResultadoYAnotaciones,
  EstadoPartido,
  puedeCambiarEstado,
  tieneResultado,
} from './entities/estado-partido.enum';
import { Partido } from './entities/partido.entity';
import { PartidoMapper } from './mappers/partido.mapper';
import { PartidoRepository } from './repositories/partido.repository';
import {
  enviarEnSegundoPlano,
  escaparHtml,
  textoMinuto,
} from './utils/correos';
import { cantidadLlaves } from './utils/llaves';

// Relaciones que necesita el mapper para armar PartidoResponse (9.10). Sin ellas, partido.fase llega undefined.
const RELACIONES_PARTIDO: FindOptionsRelations<Partido> = {
  fase: { torneo: true },
  equipoLocal: true,
  equipoVisitante: true,
  escenario: true,
};

// HU-GC-06 · ACUERDOS 6.12, 7, 8 y 9.10. Reglas de negocio de los partidos.
@Injectable()
export class PartidoService {
  private readonly logger = new Logger(PartidoService.name);

  constructor(
    @InjectRepository(Partido)
    private readonly partidoRepository: Repository<Partido>,
    // Anotacion es de B (GC-07): aquí solo se LEE (cantidadAnotaciones, el 409 al eliminar y el resumen).
    @InjectRepository(Anotacion)
    private readonly anotacionRepository: Repository<Anotacion>,
    // Repositorio propio con SQL agrupado (conteo de anotaciones de un listado en una sola consulta).
    private readonly partidoSqlRepository: PartidoRepository,
    // De C, solo lectura.
    @InjectRepository(Fase)
    private readonly faseRepository: Repository<Fase>,
    @InjectRepository(GrupoEquipo)
    private readonly grupoEquipoRepository: Repository<GrupoEquipo>,
    // De A, solo lectura.
    @InjectRepository(Equipo)
    private readonly equipoRepository: Repository<Equipo>,
    @InjectRepository(Inscripcion)
    private readonly inscripcionRepository: Repository<Inscripcion>,
    @InjectRepository(Escenario)
    private readonly escenarioRepository: Repository<Escenario>,
    // De common/ (A): cualquiera los puede usar. Vienen del NotificacionModule @Global.
    private readonly correoService: CorreoService,
    private readonly destinatariosService: DestinatariosService,
  ) {}

  async crear(
    faseId: number,
    dto: CrearPartidoDto,
  ): Promise<PartidoResponseDto> {
    // 1. Primero que todo EXISTA (404): fase, los dos equipos y el escenario (si vino).
    const fase = await this.buscarFase(faseId);
    const local = await this.buscarEquipo(dto.equipoLocalId);
    const visitante = await this.buscarEquipo(dto.equipoVisitanteId);
    const escenario = await this.buscarEscenario(dto.escenarioId);

    // 2. Regla SOLO de crear (6.12 al pie de la letra): el torneo en INSCRIPCIONES_CERRADAS o EN_CURSO.
    // No va en validarReglasPartido: editar un partido PROGRAMADO no la exige.
    const torneo = fase.torneo;
    const torneoPermitePartidos =
      torneo.estado === EstadoTorneo.INSCRIPCIONES_CERRADAS ||
      torneo.estado === EstadoTorneo.EN_CURSO;
    if (!torneoPermitePartidos) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `Solo se pueden programar partidos si el torneo está en INSCRIPCIONES_CERRADAS o EN_CURSO; el torneo '${torneo.nombre}' está en ${torneo.estado}`,
      );
    }

    // 3. Después las reglas comunes (400 y 409): las mismas que en actualizar.
    await this.validarReglasPartido(fase, local, visitante, dto, null);

    // 4. Crear (sin tocar la BD) y guardar (INSERT). Un partido nuevo nace PROGRAMADO y sin resultado (6.12).
    const partido = this.partidoRepository.create(
      PartidoMapper.aDatosEntidad(dto, fase, local, visitante, escenario),
    );
    partido.estado = EstadoPartido.PROGRAMADO;
    partido.marcadorLocal = null;
    partido.marcadorVisitante = null;
    await this.partidoRepository.save(partido);

    // 5. Correo DESPUÉS de guardar y SIN await (sección 8): si el correo falla, el partido ya quedó guardado.
    this.notificarPartidoCreado(partido);

    return PartidoMapper.aResponse(partido, 0); // recién creado: 0 anotaciones
  }

  // GET /api/fases/{faseId}/partidos?estado=
  async listarPorFase(
    faseId: number,
    filtros: FiltrosPartidoFaseDto,
  ): Promise<PartidoResponseDto[]> {
    await this.buscarFase(faseId); // solo para el 404 (si no, una fase inexistente daría [])

    const where: FindOptionsWhere<Partido> = { fase: { id: faseId } };
    // Cada filtro se agrega SOLO si vino: en TypeORM 1.1.2 una clave con undefined o null lanza error.
    if (filtros.estado) {
      where.estado = filtros.estado;
    }
    return this.buscarPartidos(where);
  }

  // GET /api/partidos?torneoId=&equipoId=&estado=
  async listar(filtros: FiltrosPartidoDto): Promise<PartidoResponseDto[]> {
    // Condiciones comunes (AND). Solo se agrega cada una si vino.
    const condicion: FindOptionsWhere<Partido> = {};
    if (filtros.torneoId !== undefined) {
      // El partido no tiene torneo_id: el torneo se alcanza a través de su fase.
      condicion.fase = { torneo: { id: filtros.torneoId } };
    }
    if (filtros.estado) {
      condicion.estado = filtros.estado;
    }

    if (filtros.equipoId === undefined) {
      return this.buscarPartidos(condicion);
    }

    // equipoId: el equipo juega de local O de visitante. Un ARREGLO en "where" = OR.
    // Cada rama repite las condiciones comunes (AND dentro de cada objeto).
    return this.buscarPartidos([
      { ...condicion, equipoLocal: { id: filtros.equipoId } },
      { ...condicion, equipoVisitante: { id: filtros.equipoId } },
    ]);
  }

  async obtener(id: number): Promise<PartidoResponseDto> {
    const partido = await this.buscarEntidad(id);
    return this.aResponseConAnotaciones(partido);
  }

  // PUT /api/partidos/{id}. La fase no cambia: no viene en el body (PartidoRequest, 9.10).
  async actualizar(
    id: number,
    dto: ActualizarPartidoDto,
  ): Promise<PartidoResponseDto> {
    // 1. Existencia (404): el partido, los equipos y el escenario.
    const partido = await this.buscarEntidad(id);
    const local = await this.buscarEquipo(dto.equipoLocalId);
    const visitante = await this.buscarEquipo(dto.equipoVisitanteId);
    const escenario = await this.buscarEscenario(dto.escenarioId);

    // 2. Regla: solo se edita un partido PROGRAMADO (6.12).
    if (partido.estado !== EstadoPartido.PROGRAMADO) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `Solo se puede editar un partido PROGRAMADO; este partido está ${partido.estado}`,
      );
    }

    // 3. Las mismas reglas que al crear. Se pasa el id para que no se encuentre a sí mismo en la llave.
    await this.validarReglasPartido(
      partido.fase,
      local,
      visitante,
      dto,
      partido.id,
    );

    // 4. Object.assign y NO repository.merge: merge mezcla los datos DENTRO del equipo viejo
    // (no cambia la referencia) y no sabe quitar un escenario (con null deja el anterior).
    Object.assign(
      partido,
      PartidoMapper.aDatosEntidad(
        dto,
        partido.fase,
        local,
        visitante,
        escenario,
      ),
    );
    await this.partidoRepository.save(partido); // save con id = UPDATE
    return this.aResponseConAnotaciones(partido);
  }

  // PATCH /api/partidos/{id}/estado
  async cambiarEstado(
    id: number,
    nuevoEstado: EstadoPartido,
  ): Promise<PartidoResponseDto> {
    const partido = await this.buscarEntidad(id);

    // Regla: solo las transiciones de la tabla (6.12). puedeCambiarEstado responde; el service lanza.
    if (!puedeCambiarEstado(partido.estado, nuevoEstado)) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `No se puede pasar un partido de ${partido.estado} a ${nuevoEstado}`,
      );
    }

    // Regla: pasar a FINALIZADO exige el resultado registrado (los dos marcadores).
    if (nuevoEstado === EstadoPartido.FINALIZADO && !tieneResultado(partido)) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        'Para finalizar el partido primero debe registrar el resultado (marcador local y visitante)',
      );
    }

    partido.estado = nuevoEstado;
    await this.partidoRepository.save(partido);

    // GC-07: al FINALIZAR, correo "Resumen" DESPUÉS del save y SIN await (sección 8). Hasta la lectura
    // de las anotaciones va en segundo plano: si falla, el estado ya quedó guardado y la respuesta sale igual.
    if (nuevoEstado === EstadoPartido.FINALIZADO) {
      this.notificarResumen(partido);
    }

    return this.aResponseConAnotaciones(partido);
  }

  // PUT /api/partidos/{id}/resultado (GC-07, 9.11). Registra o modifica el marcador.
  // Va en este service porque el resultado son columnas de partido (6.12) y así se reutilizan
  // buscarEntidad y aResponseConAnotaciones. Lo expone ResultadoController (9.11).
  async registrarResultado(
    id: number,
    dto: ResultadoDto,
  ): Promise<PartidoResponseDto> {
    const partido = await this.buscarEntidad(id); // 404

    // Regla: el resultado se registra o modifica solo en EN_JUEGO o FINALIZADO (6.12).
    if (!admiteResultadoYAnotaciones(partido.estado)) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `Solo se registra el resultado de un partido EN_JUEGO o FINALIZADO; este partido está ${partido.estado}`,
      );
    }

    // Regla: mientras el torneo NO esté FINALIZADO (6.12). El torneo llega por partido.fase.torneo.
    const torneo = partido.fase.torneo;
    if (torneo.estado === EstadoTorneo.FINALIZADO) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `No se puede modificar el resultado: el torneo '${torneo.nombre}' ya está FINALIZADO`,
      );
    }

    // El marcador NO se calcula con las anotaciones: lo registra el administrador (6.12).
    partido.marcadorLocal = dto.marcadorLocal;
    partido.marcadorVisitante = dto.marcadorVisitante;
    await this.partidoRepository.save(partido); // save con id = UPDATE
    return this.aResponseConAnotaciones(partido);
  }

  // DELETE /api/partidos/{id}: solo PROGRAMADO y sin anotaciones (6.12).
  async eliminar(id: number): Promise<void> {
    const partido = await this.buscarEntidad(id);

    // Regla: solo se elimina un partido PROGRAMADO.
    if (partido.estado !== EstadoPartido.PROGRAMADO) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `Solo se puede eliminar un partido PROGRAMADO; este partido está ${partido.estado}`,
      );
    }

    // Regla: no se elimina si tiene anotaciones. countBy (y no existsBy) porque el mensaje dice CUÁNTAS.
    const cantidadAnotaciones = await this.anotacionRepository.countBy({
      partido: { id },
    });
    if (cantidadAnotaciones > 0) {
      throw new ApplicationException(
        ErrorCase.HAS_ASSOCIATIONS,
        `No se puede eliminar el partido porque tiene ${cantidadAnotaciones} anotación(es) registrada(s)`,
      );
    }

    await this.partidoRepository.remove(partido);
  }

  // ---------------------------------------------------------------------------------------------
  // Reglas comunes de crear y actualizar (400 y 409). Todo lo que existe (404) ya se buscó antes.
  // El estado del torneo NO está aquí: solo lo exige crear (6.12).
  // partidoId: null al crear; el id del partido al actualizar (para el Not(id) de la llave).
  // ---------------------------------------------------------------------------------------------
  private async validarReglasPartido(
    fase: Fase,
    local: Equipo,
    visitante: Equipo,
    dto: CrearPartidoDto,
    partidoId: number | null,
  ): Promise<void> {
    const torneo = fase.torneo;

    // Regla: un equipo no puede competir contra sí mismo (6.12).
    if (local.id === visitante.id) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        'Un equipo no puede competir contra sí mismo',
      );
    }

    // Regla: la fecha cae dentro del torneo; el primer y el último día valen (>= y <=).
    // slice(0, 10) corta la hora: "2026-12-20T15:30:00" → "2026-12-20", y se compara texto con texto.
    const dia = dto.fechaHora.slice(0, 10);
    const dentroDelTorneo = dia >= torneo.fechaInicio && dia <= torneo.fechaFin;
    if (!dentroDelTorneo) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `La fecha del partido debe estar entre ${torneo.fechaInicio} y ${torneo.fechaFin} (fechas del torneo)`,
      );
    }

    // Regla: los dos equipos habilitados = activos e inscritos en el torneo de la fase (6.12).
    await this.validarEquipoHabilitado(local, torneo);
    await this.validarEquipoHabilitado(visitante, torneo);

    // Reglas según el TIPO de fase. Fase es abstracta: TypeORM entrega un Grupo o una FaseFinal.
    const ronda = dto.ronda ?? null;
    const numeroLlave = dto.numeroLlave ?? null;
    if (fase instanceof Grupo) {
      await this.validarPartidoDeGrupo(
        fase,
        local,
        visitante,
        ronda,
        numeroLlave,
      );
    }
    if (fase instanceof FaseFinal) {
      await this.validarPartidoDeFaseFinal(fase, ronda, numeroLlave, partidoId);
    }
  }

  // Equipo habilitado: activo (5.4: nada se asocia a un inactivo) e inscrito en el torneo (Inscripcion de A).
  private async validarEquipoHabilitado(
    equipo: Equipo,
    torneo: Torneo,
  ): Promise<void> {
    if (!equipo.activo) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `El equipo '${equipo.nombre}' está inactivo y no puede jugar partidos`,
      );
    }
    const inscrito = await this.inscripcionRepository.existsBy({
      torneo: { id: torneo.id },
      equipo: { id: equipo.id },
    });
    if (!inscrito) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `El equipo '${equipo.nombre}' no está inscrito en el torneo '${torneo.nombre}'`,
      );
    }
  }

  // Partido de GRUPO: sin ronda ni llave, y los dos equipos deben pertenecer a ESE grupo (GrupoEquipo de C).
  private async validarPartidoDeGrupo(
    grupo: Grupo,
    local: Equipo,
    visitante: Equipo,
    ronda: RondaFinal | null,
    numeroLlave: number | null,
  ): Promise<void> {
    // Regla: en un grupo, ronda y numeroLlave van en null (6.12).
    if (ronda !== null || numeroLlave !== null) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        'En un partido de grupo la ronda y el número de llave deben ir vacíos (null)',
      );
    }

    // Regla: los dos equipos pertenecen al grupo. Se recorren los dos con el mismo chequeo.
    for (const equipo of [local, visitante]) {
      const estaEnElGrupo = await this.grupoEquipoRepository.existsBy({
        grupo: { id: grupo.id },
        equipo: { id: equipo.id },
      });
      if (!estaEnElGrupo) {
        throw new ApplicationException(
          ErrorCase.INVALID_OPERATION,
          `El equipo '${equipo.nombre}' no pertenece al grupo '${grupo.nombre}'`,
        );
      }
    }
  }

  // Partido de la FASE FINAL: ronda y llave obligatorias, válidas para la fase y sin repetir la llave.
  private async validarPartidoDeFaseFinal(
    faseFinal: FaseFinal,
    ronda: RondaFinal | null,
    numeroLlave: number | null,
    partidoId: number | null,
  ): Promise<void> {
    // Regla: en la fase final, ronda y numeroLlave son obligatorios (6.12).
    if (ronda === null || numeroLlave === null) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        'En un partido de la fase final la ronda y el número de llave son obligatorios',
      );
    }

    // Regla: la ronda debe existir para la cantidad de equipos de la fase (6.11). 0 = no existe.
    const llaves = cantidadLlaves(
      ronda,
      faseFinal.cantidadEquipos,
      faseFinal.tercerPuesto,
    );
    if (llaves === 0) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `La ronda ${ronda} no es válida para la fase final '${faseFinal.nombre}' (${faseFinal.cantidadEquipos} equipos)`,
      );
    }

    // Regla: la llave está en rango, de 1 a "llaves" (el DTO ya garantiza que es >= 1).
    if (numeroLlave > llaves) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `La ronda ${ronda} tiene ${llaves} llave(s): el número de llave debe estar entre 1 y ${llaves}`,
      );
    }

    // Regla: no dos partidos NO cancelados en la misma fase + ronda + llave (6.12).
    const where: FindOptionsWhere<Partido> = {
      fase: { id: faseFinal.id },
      ronda,
      numeroLlave,
      estado: Not(EstadoPartido.CANCELADO),
    };
    // Al actualizar, el partido no debe encontrarse a sí mismo (como el Not(id) de jugador).
    if (partidoId !== null) {
      where.id = Not(partidoId);
    }
    const llaveOcupada = await this.partidoRepository.existsBy(where);
    if (llaveOcupada) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `Ya existe un partido no cancelado en la llave ${numeroLlave} de ${ronda} de esta fase`,
      );
    }
  }

  // ---------------------------------------------------------------------------------------------
  // Búsquedas (404) y armado de respuestas
  // ---------------------------------------------------------------------------------------------

  // Los dos listados terminan aquí: mismo orden, mismas relaciones y un solo conteo de anotaciones.
  private async buscarPartidos(
    where: FindOptionsWhere<Partido> | FindOptionsWhere<Partido>[],
  ): Promise<PartidoResponseDto[]> {
    const partidos = await this.partidoRepository.find({
      where,
      relations: RELACIONES_PARTIDO,
      // 5.4: partidos por fechaHora ascendente. id ASC desempata dos partidos a la misma hora
      // (sin él, MySQL puede devolverlos en cualquier orden y el listado "salta" entre llamadas).
      order: { fechaHora: 'ASC', id: 'ASC' },
    });
    // Una sola consulta agrupada para todos (no un countBy por partido: evita N+1).
    const ids = partidos.map((partido) => partido.id);
    const conteo =
      await this.partidoSqlRepository.contarAnotacionesPorPartido(ids);
    return partidos.map((partido) =>
      PartidoMapper.aResponse(partido, conteo.get(partido.id) ?? 0),
    );
  }

  // Para un solo partido basta countBy (una consulta).
  private async aResponseConAnotaciones(
    partido: Partido,
  ): Promise<PartidoResponseDto> {
    const cantidadAnotaciones = await this.anotacionRepository.countBy({
      partido: { id: partido.id },
    });
    return PartidoMapper.aResponse(partido, cantidadAnotaciones);
  }

  // findOne devuelve null (no lanza) → el 404 lo lanzamos nosotros. Trae las relaciones del response.
  private async buscarEntidad(id: number): Promise<Partido> {
    const partido = await this.partidoRepository.findOne({
      where: { id },
      relations: RELACIONES_PARTIDO,
    });
    if (!partido) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe el partido con id ${id}`,
      );
    }
    return partido;
  }

  // Fase de C (consulta de la sección 7): con su torneo, para las reglas de estado y fechas.
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

  // Equipo de A: solo se LEE.
  private async buscarEquipo(id: number): Promise<Equipo> {
    const equipo = await this.equipoRepository.findOneBy({ id });
    if (!equipo) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe el equipo con id ${id}`,
      );
    }
    return equipo;
  }

  // Escenario de A, opcional ("cuando corresponda"): si no vino (null o undefined), el partido no tiene.
  // El DTO ya garantiza que, si viene, es >= 1 (un 0 nunca llega aquí).
  private async buscarEscenario(
    id: number | null | undefined,
  ): Promise<Escenario | null> {
    if (!id) {
      return null;
    }
    const escenario = await this.escenarioRepository.findOneBy({ id });
    if (!escenario) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe el escenario con id ${id}`,
      );
    }
    return escenario;
  }

  // Correo "Nuevo partido" (sección 8). Se llama SIN await: la petición responde sin esperar el correo.
  // enviarEnSegundoPlano (utils/correos.ts) encadena destinatarios → enviar y pone el .catch.
  private notificarPartidoCreado(partido: Partido): void {
    const local = partido.equipoLocal.nombre;
    const visitante = partido.equipoVisitante.nombre;
    const escenario = partido.escenario
      ? partido.escenario.nombre
      : 'Por definir';
    // El asunto es texto plano: va sin escapar. En el HTML, todo texto que viene de la BD pasa por escaparHtml.
    const asunto = `Nuevo partido: ${local} vs ${visitante}`;
    const html =
      `<p>Se programó el partido <b>${escaparHtml(local)} vs ${escaparHtml(visitante)}</b>.</p>` +
      `<ul><li>Torneo: ${escaparHtml(partido.fase.torneo.nombre)}</li>` +
      `<li>Fase: ${escaparHtml(partido.fase.nombre)}</li>` +
      `<li>Fecha y hora: ${aFechaHoraIso(partido.fechaHora)}</li>` +
      `<li>Escenario: ${escaparHtml(escenario)}</li></ul>`;

    enviarEnSegundoPlano(
      this.destinatariosService.aficionadosDeEquipos(
        partido.equipoLocal.id,
        partido.equipoVisitante.id,
      ),
      asunto,
      html,
      this.correoService,
      this.logger,
      `el correo del partido ${partido.id}`,
    );
  }

  // Correo "Resumen" al FINALIZAR (sección 8). Todo va en segundo plano, incluida la LECTURA de las
  // anotaciones: find(...).then(armar y enviar).catch(log). Si el find falla, solo queda en el log;
  // el estado FINALIZADO ya se guardó y cambiarEstado responde igual (nadie espera esta cadena).
  private notificarResumen(partido: Partido): void {
    this.anotacionRepository
      .find({
        where: { partido: { id: partido.id } },
        relations: { jugador: true },
        order: { minuto: 'ASC', id: 'ASC' }, // mismo orden que GET .../anotaciones
      })
      .then((anotaciones: Anotacion[]) =>
        this.enviarResumen(partido, anotaciones),
      )
      .catch((error: unknown) => {
        this.logger.error(
          `No se pudo armar el resumen del partido ${partido.id}: ${String(error)}`,
        );
      });
  }

  // Arma el resumen (marcador final y lista de anotaciones) y lo dispara. Los marcadores ya no son null:
  // pasar a FINALIZADO exige el resultado registrado.
  private enviarResumen(partido: Partido, anotaciones: Anotacion[]): void {
    const local = partido.equipoLocal.nombre;
    const visitante = partido.equipoVisitante.nombre;
    const marcador = `${local} ${partido.marcadorLocal} - ${partido.marcadorVisitante} ${visitante}`;
    const asunto = `Resumen: ${marcador}`; // texto plano, sin escapar

    // Una línea <li> por anotación, en orden de minuto.
    let lista = '';
    for (const anotacion of anotaciones) {
      const jugador = escaparHtml(
        JugadorMapper.nombreCompleto(anotacion.jugador),
      );
      const minuto = textoMinuto(anotacion.minuto);
      lista += `<li>${jugador} · ${minuto} · ${anotacion.valor} punto(s)</li>`;
    }
    if (anotaciones.length === 0) {
      lista = '<li>No se registraron anotaciones</li>';
    }

    const html =
      `<p>Terminó el partido: <b>${escaparHtml(marcador)}</b>.</p>` +
      `<p>Anotaciones:</p><ul>${lista}</ul>`;

    enviarEnSegundoPlano(
      this.destinatariosService.aficionadosDelPartido(partido.id),
      asunto,
      html,
      this.correoService,
      this.logger,
      `el resumen del partido ${partido.id}`,
    );
  }
}
