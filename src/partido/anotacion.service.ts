import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
import { CorreoService } from '../common/notificacion/correo.service';
import { DestinatariosService } from '../common/notificacion/destinatarios.service';
// TODO: Equipo es de A; aquí solo como TIPO (el equipo llega dentro del contrato o del partido)
import type { Equipo } from '../equipo/entities/equipo.entity';
import { EstadoTorneo } from '../torneo/entities/estado-torneo.enum';
// Jugador y EquipoJugador son de B (jugador/): mismo dueño, se leen con su Repository<T>.
import { EquipoJugador } from '../jugador/entities/equipo-jugador.entity';
import { Jugador } from '../jugador/entities/jugador.entity';
import { JugadorMapper } from '../jugador/mappers/jugador.mapper';
import { aFechaHoraIso } from '../common/utils/fechas';
import { ActualizarAnotacionDto } from './dto/actualizar-anotacion.dto';
import { AnotacionResponseDto } from './dto/anotacion-response.dto';
import { CrearAnotacionDto } from './dto/crear-anotacion.dto';
import { Anotacion } from './entities/anotacion.entity';
import {
  admiteResultadoYAnotaciones,
  tieneResultado,
} from './entities/estado-partido.enum';
import { Partido } from './entities/partido.entity';
import { AnotacionMapper } from './mappers/anotacion.mapper';
import {
  enviarEnSegundoPlano,
  escaparHtml,
  textoMinuto,
} from './utils/correos';

// HU-GC-07 · ACUERDOS 6.13, 8 y 9.11. Reglas de negocio de las anotaciones de un partido.
@Injectable()
export class AnotacionService {
  private readonly logger = new Logger(AnotacionService.name);

  constructor(
    @InjectRepository(Anotacion)
    private readonly anotacionRepository: Repository<Anotacion>,
    @InjectRepository(Partido)
    private readonly partidoRepository: Repository<Partido>,
    @InjectRepository(Jugador)
    private readonly jugadorRepository: Repository<Jugador>,
    // Contratos (GD-05): solo se LEEN para saber con qué equipo del partido juega el jugador.
    @InjectRepository(EquipoJugador)
    private readonly equipoJugadorRepository: Repository<EquipoJugador>,
    // De common/ (A): vienen del NotificacionModule @Global.
    private readonly correoService: CorreoService,
    private readonly destinatariosService: DestinatariosService,
  ) {}

  // POST /api/partidos/{partidoId}/anotaciones
  async crear(
    partidoId: number,
    dto: CrearAnotacionDto,
  ): Promise<AnotacionResponseDto> {
    // 1. Primero que todo EXISTA (404): el partido y el jugador.
    const partido = await this.buscarPartido(partidoId);
    const jugador = await this.buscarJugador(dto.jugadorId);

    // 2. Después las reglas (400): estado del partido y del torneo, y luego el jugador.
    // validarJugadorDelPartido devuelve el equipo deducido del contrato activo.
    this.validarEstadoParaAnotar(partido);
    const equipo = await this.validarJugadorDelPartido(partido, jugador);

    // 3. Crear (sin tocar la BD) y guardar (INSERT).
    const anotacion = this.anotacionRepository.create(
      AnotacionMapper.aDatosEntidad(dto, partido, jugador),
    );
    await this.anotacionRepository.save(anotacion);

    // 4. Correo DESPUÉS de guardar y SIN await (sección 8): si el correo falla, la anotación ya quedó.
    this.notificarAnotacion(anotacion, equipo);

    return AnotacionMapper.aResponse(anotacion, equipo);
  }

  // GET /api/partidos/{partidoId}/anotaciones (9.11: "por minuto")
  async listar(partidoId: number): Promise<AnotacionResponseDto[]> {
    const partido = await this.buscarPartido(partidoId); // 404 (si no, un partido inexistente daría [])

    const anotaciones = await this.anotacionRepository.find({
      where: { partido: { id: partidoId } },
      relations: { partido: true, jugador: true },
      // MySQL pone los NULL primero en ASC: las anotaciones sin minuto salen al inicio.
      // id ASC desempata: con el mismo minuto, en el orden en que se registraron.
      order: { minuto: 'ASC', id: 'ASC' },
    });

    // El equipo de cada anotación se deduce con UNA consulta para todas (evita N+1).
    const equipoPorJugador = await this.equiposDeLosJugadores(
      anotaciones,
      partido,
    );
    return anotaciones.map((anotacion) =>
      AnotacionMapper.aResponse(
        anotacion,
        equipoPorJugador.get(anotacion.jugador.id) ?? null,
      ),
    );
  }

  // PUT /api/anotaciones/{id}. Reemplazo completo: se puede cambiar el jugador, el minuto, el valor...
  async actualizar(
    id: number,
    dto: ActualizarAnotacionDto,
  ): Promise<AnotacionResponseDto> {
    // 1. Existencia (404): la anotación (con su partido) y, SOLO si cambia, el jugador del body.
    const anotacion = await this.buscarEntidad(id);
    const partido = anotacion.partido; // la anotación no cambia de partido
    const cambiaJugador = dto.jugadorId !== anotacion.jugador.id;
    let jugador = anotacion.jugador;
    if (cambiaJugador) {
      jugador = await this.buscarJugador(dto.jugadorId);
    }

    // 2. Regla del estado: SIEMPRE, aunque solo se corrija el minuto.
    this.validarEstadoParaAnotar(partido);

    // 3. Reglas del jugador (activo y contrato activo) SOLO si cambia el jugador. Si es el mismo, ya se
    // validaron al crear: exigirlas otra vez impediría corregir el minuto de alguien que después se retiró.
    let equipo: Equipo | null;
    if (cambiaJugador) {
      equipo = await this.validarJugadorDelPartido(partido, jugador);
    } else {
      // Mismo jugador: el equipo se deduce con el MISMO criterio que el listado.
      const equipoPorJugador = await this.equiposDeLosJugadores(
        [anotacion],
        partido,
      );
      equipo = equipoPorJugador.get(jugador.id) ?? null;
    }

    // 4. Object.assign y NO repository.merge: merge mezclaría el jugador nuevo DENTRO del objeto
    // del jugador viejo (no cambia la referencia), igual que en PartidoService.actualizar.
    Object.assign(
      anotacion,
      AnotacionMapper.aDatosEntidad(dto, partido, jugador),
    );
    await this.anotacionRepository.save(anotacion); // save con id = UPDATE
    return AnotacionMapper.aResponse(anotacion, equipo);
  }

  // DELETE /api/anotaciones/{id}. Borra SOLO la fila de anotacion: el jugador y el partido siguen (6.13).
  async eliminar(id: number): Promise<void> {
    const anotacion = await this.buscarEntidad(id); // 404

    // Regla: las mismas condiciones que crear y editar (decisión del equipo): un partido CANCELADO o
    // un torneo FINALIZADO no dejan borrar.
    this.validarEstadoParaAnotar(anotacion.partido);

    await this.anotacionRepository.remove(anotacion);
  }

  // ---------------------------------------------------------------------------------------------
  // Reglas (400). Todo lo que existe (404) ya se buscó antes.
  // ---------------------------------------------------------------------------------------------

  // Crear, editar y eliminar exigen lo mismo que el resultado (6.12 y 6.13). No consulta la BD:
  // el partido llega con fase.torneo cargado (buscarPartido y buscarEntidad).
  private validarEstadoParaAnotar(partido: Partido): void {
    // Regla: el partido EN_JUEGO o FINALIZADO.
    if (!admiteResultadoYAnotaciones(partido.estado)) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `Solo se pueden registrar, editar o eliminar anotaciones de un partido EN_JUEGO o FINALIZADO; este partido está ${partido.estado}`,
      );
    }

    // Regla: el torneo NO FINALIZADO (como el resultado: un torneo cerrado ya no cambia sus datos).
    const torneo = partido.fase.torneo;
    if (torneo.estado === EstadoTorneo.FINALIZADO) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `No se pueden modificar las anotaciones: el torneo '${torneo.nombre}' ya está FINALIZADO`,
      );
    }
  }

  // Reglas del jugador. Devuelve el equipo del partido con el que el jugador tiene contrato activo.
  private async validarJugadorDelPartido(
    partido: Partido,
    jugador: Jugador,
  ): Promise<Equipo> {
    const nombreJugador = JugadorMapper.nombreCompleto(jugador);

    // Regla: no se asocia nada a un registro inactivo (5.4).
    if (!jugador.activo) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `El jugador ${nombreJugador} está inactivo y no puede registrar anotaciones`,
      );
    }

    // Regla: contrato ACTIVO con el local O con el visitante (6.13). Arreglo en "where" = OR.
    // Si tuviera los dos (puede, 6.5), gana el contrato más reciente.
    const contrato = await this.equipoJugadorRepository.findOne({
      where: [
        {
          jugador: { id: jugador.id },
          equipo: { id: partido.equipoLocal.id },
          activo: true,
        },
        {
          jugador: { id: jugador.id },
          equipo: { id: partido.equipoVisitante.id },
          activo: true,
        },
      ],
      relations: { equipo: true },
      order: { fechaInicio: 'DESC', id: 'DESC' },
    });
    if (!contrato) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `El jugador ${nombreJugador} no tiene contrato activo con '${partido.equipoLocal.nombre}' ni con '${partido.equipoVisitante.nombre}'`,
      );
    }
    return contrato.equipo; // el equipo de la anotación se deduce de ese contrato (6.13)
  }

  // Para el listado (y para editar sin cambiar de jugador): jugadorId → equipo, con UNA consulta.
  // Se usan TODOS los contratos (activos y retirados) con el local o el visitante, porque el jugador
  // pudo retirarse o pasarse al rival después del partido.
  // Criterio: 1) el contrato que cubría la FECHA DEL PARTIDO; 2) si ninguno la cubre, el primero del
  // orden (activos primero y después el más reciente).
  private async equiposDeLosJugadores(
    anotaciones: Anotacion[],
    partido: Partido,
  ): Promise<Map<number, Equipo>> {
    const equipoPorJugador = new Map<number, Equipo>();
    if (anotaciones.length === 0) {
      return equipoPorJugador; // sin anotaciones no hay nada que buscar
    }

    const jugadorIds = anotaciones.map((anotacion) => anotacion.jugador.id);
    const contratos = await this.equipoJugadorRepository.find({
      where: [
        {
          jugador: { id: In(jugadorIds) },
          equipo: { id: partido.equipoLocal.id },
        },
        {
          jugador: { id: In(jugadorIds) },
          equipo: { id: partido.equipoVisitante.id },
        },
      ],
      relations: { jugador: true, equipo: true },
      order: { activo: 'DESC', fechaInicio: 'DESC', id: 'DESC' },
    });

    // Día del partido como texto "yyyy-MM-dd" (se compara texto con texto, como las columnas DATE).
    const fechaPartido = aFechaHoraIso(partido.fechaHora).slice(0, 10);
    // Jugadores cuyo equipo ya salió de un contrato que cubre la fecha: ese es definitivo.
    const yaCubreLaFecha = new Set<number>();

    // Una sola pasada por la lista (ya ordenada).
    for (const contrato of contratos) {
      const jugadorId = contrato.jugador.id;
      if (yaCubreLaFecha.has(jugadorId)) {
        continue; // ya tiene el contrato del día del partido: no se pisa
      }
      // Preferido: el contrato vigente el día del partido.
      if (this.contratoCubreFecha(contrato, fechaPartido)) {
        equipoPorJugador.set(jugadorId, contrato.equipo);
        yaCubreLaFecha.add(jugadorId);
        continue;
      }
      // Respaldo: el primero del orden, solo si todavía no tiene ninguno.
      if (!equipoPorJugador.has(jugadorId)) {
        equipoPorJugador.set(jugadorId, contrato.equipo);
      }
    }
    return equipoPorJugador;
  }

  // ¿El contrato estaba vigente ese día? Empezó ese día o antes Y (no se ha retirado o se retiró ese día
  // o después). Texto "yyyy-MM-dd" contra texto: el orden alfabético coincide con el de las fechas.
  private contratoCubreFecha(contrato: EquipoJugador, fecha: string): boolean {
    const yaHabiaEmpezado = contrato.fechaInicio <= fecha;
    const seguiaVigente =
      contrato.fechaRetiro === null || contrato.fechaRetiro >= fecha;
    return yaHabiaEmpezado && seguiaVigente;
  }

  // ---------------------------------------------------------------------------------------------
  // Búsquedas (404) y correo
  // ---------------------------------------------------------------------------------------------

  // findOne devuelve null (no lanza) → el 404 lo lanzamos nosotros. Trae la fase con su torneo (regla del
  // torneo FINALIZADO) y el local y el visitante (regla del contrato y asunto del correo).
  private async buscarPartido(id: number): Promise<Partido> {
    const partido = await this.partidoRepository.findOne({
      where: { id },
      relations: {
        fase: { torneo: true },
        equipoLocal: true,
        equipoVisitante: true,
      },
    });
    if (!partido) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe el partido con id ${id}`,
      );
    }
    return partido;
  }

  private async buscarJugador(id: number): Promise<Jugador> {
    const jugador = await this.jugadorRepository.findOneBy({ id });
    if (!jugador) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe el jugador con id ${id}`,
      );
    }
    return jugador;
  }

  // La anotación con su partido (fase con torneo y los dos equipos) y su jugador: lo que piden las
  // reglas y el mapper.
  private async buscarEntidad(id: number): Promise<Anotacion> {
    const anotacion = await this.anotacionRepository.findOne({
      where: { id },
      relations: {
        partido: {
          fase: { torneo: true },
          equipoLocal: true,
          equipoVisitante: true,
        },
        jugador: true,
      },
    });
    if (!anotacion) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe la anotación con id ${id}`,
      );
    }
    return anotacion;
  }

  // Correo "¡Anotación!" (sección 8). Se llama SIN await: la petición responde sin esperar el correo.
  // enviarEnSegundoPlano (utils/correos.ts) encadena destinatarios → enviar y pone el .catch.
  private notificarAnotacion(anotacion: Anotacion, equipo: Equipo): void {
    const partido = anotacion.partido;
    const local = partido.equipoLocal.nombre;
    const visitante = partido.equipoVisitante.nombre;
    const marcador = tieneResultado(partido)
      ? `${local} ${partido.marcadorLocal} - ${partido.marcadorVisitante} ${visitante}`
      : 'Sin registrar';
    const asunto = `¡Anotación en ${local} vs ${visitante}!`; // texto plano, sin escapar
    // En el HTML, todo texto que viene de la BD pasa por escaparHtml.
    const html =
      `<p><b>${escaparHtml(JugadorMapper.nombreCompleto(anotacion.jugador))}</b> ` +
      `(${escaparHtml(equipo.nombre)}) anotó en ` +
      `<b>${escaparHtml(local)} vs ${escaparHtml(visitante)}</b> (${textoMinuto(anotacion.minuto)}).</p>` +
      `<ul><li>Valor: ${anotacion.valor}</li>` +
      `<li>Marcador actual: ${escaparHtml(marcador)}</li></ul>`;

    enviarEnSegundoPlano(
      this.destinatariosService.aficionadosDelPartido(partido.id),
      asunto,
      html,
      this.correoService,
      this.logger,
      `el correo de la anotación ${anotacion.id}`,
    );
  }
}
