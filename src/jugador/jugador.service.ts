import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Not, Repository } from 'typeorm';
// TODO: ajustar la ruta cuando A suba common/errores
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
// TODO: HabilidadJugador es de C (6.7 y 6.14); compila cuando C suba habilidad-jugador/entities/habilidad-jugador.entity.ts
import { HabilidadJugador } from '../habilidad-jugador/entities/habilidad-jugador.entity';
// Anotacion es de B (partido/, GC-07): mismo dueño, se lee aquí solo para contar.
import { Anotacion } from '../partido/entities/anotacion.entity';
import { ActualizarJugadorDto } from './dto/actualizar-jugador.dto';
import { CrearJugadorDto } from './dto/crear-jugador.dto';
import { FiltrosJugadorDto } from './dto/filtros-jugador.dto';
import { JugadorResponseDto } from './dto/jugador-response.dto';
import { EquipoJugador } from './entities/equipo-jugador.entity';
import { Jugador } from './entities/jugador.entity';
import { JugadorMapper } from './mappers/jugador.mapper';
import { escaparLike } from './utils/consultas';
import { hoyBogota } from './utils/fechas';

@Injectable()
export class JugadorService {
  constructor(
    @InjectRepository(Jugador)
    private readonly jugadorRepository: Repository<Jugador>,
    // Contratos (GD-05, también de B): solo se cuentan para decidir si el jugador se puede eliminar.
    @InjectRepository(EquipoJugador)
    private readonly equipoJugadorRepository: Repository<EquipoJugador>,
    // Habilidades asignadas (de C, SOLO lectura: countBy) y anotaciones (de B): también se cuentan para eliminar.
    @InjectRepository(HabilidadJugador)
    private readonly habilidadJugadorRepository: Repository<HabilidadJugador>,
    @InjectRepository(Anotacion)
    private readonly anotacionRepository: Repository<Anotacion>,
  ) {}

  async crear(dto: CrearJugadorDto): Promise<JugadorResponseDto> {
    // 1. Regla de negocio: la fecha de nacimiento debe ser pasada.
    this.validarFechaNacimiento(dto.fechaNacimiento);

    // 2. Regla de negocio: no duplicados. El identificador es la PAREJA tipo + número (igual que el @Unique de la entidad).
    const yaExiste = await this.jugadorRepository.existsBy({
      tipoDocumento: dto.tipoDocumento,
      numeroDocumento: dto.numeroDocumento,
    });
    if (yaExiste) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `Ya existe un jugador con el documento ${dto.tipoDocumento} ${dto.numeroDocumento}`,
      );
    }

    // 3. Crear (sin tocar la BD), guardar (INSERT) y responder con el DTO, nunca con la entidad.
    const jugador = this.jugadorRepository.create(
      JugadorMapper.aDatosEntidad(dto),
    );
    await this.jugadorRepository.save(jugador);
    return JugadorMapper.aResponse(jugador);
  }

  async listar(filtros: FiltrosJugadorDto): Promise<JugadorResponseDto[]> {
    const filtroActivo =
      filtros.activo === undefined ? {} : { activo: filtros.activo };
    // Se escapan los comodines de LIKE (% y _) para que busqueda="_" busque un guion bajo y no "cualquier cosa".
    const texto = filtros.busqueda
      ? `%${escaparLike(filtros.busqueda)}%`
      : null;

    // Un ARREGLO en "where" = condiciones unidas con OR. Cada objeto por dentro = condiciones con AND.
    // Like(...) va como parámetro (?), no se pega en el SQL: no hay inyección.
    const where = texto
      ? [
          { nombres: Like(texto), ...filtroActivo },
          { apellidos: Like(texto), ...filtroActivo },
          { numeroDocumento: Like(texto), ...filtroActivo },
        ]
      : filtroActivo;

    const jugadores = await this.jugadorRepository.find({
      where,
      order: { apellidos: 'ASC', nombres: 'ASC' },
    });
    return jugadores.map((jugador) => JugadorMapper.aResponse(jugador));
  }

  async obtener(id: number): Promise<JugadorResponseDto> {
    const jugador = await this.buscarEntidad(id);
    return JugadorMapper.aResponse(jugador);
  }

  async actualizar(
    id: number,
    dto: ActualizarJugadorDto,
  ): Promise<JugadorResponseDto> {
    const jugador = await this.buscarEntidad(id);
    this.validarFechaNacimiento(dto.fechaNacimiento);

    // Duplicado: otro jugador (id DISTINTO al que se edita) con el mismo tipo + número.
    // Sin el Not(id), editar solo el teléfono de Juan lo encontraría a él mismo y daría un 409 falso.
    const otroConEseDocumento = await this.jugadorRepository.existsBy({
      tipoDocumento: dto.tipoDocumento,
      numeroDocumento: dto.numeroDocumento,
      id: Not(id),
    });
    if (otroConEseDocumento) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `Ya existe otro jugador con el documento ${dto.tipoDocumento} ${dto.numeroDocumento}`,
      );
    }

    // merge copia los campos del DTO sobre la entidad; save con id = UPDATE.
    this.jugadorRepository.merge(jugador, JugadorMapper.aDatosEntidad(dto));
    await this.jugadorRepository.save(jugador);
    return JugadorMapper.aResponse(jugador);
  }

  // Desactivar o reactivar: siempre se permite (sección 5.4). Desactivar ≠ eliminar.
  async cambiarEstado(
    id: number,
    activo: boolean,
  ): Promise<JugadorResponseDto> {
    const jugador = await this.buscarEntidad(id);
    jugador.activo = activo;
    await this.jugadorRepository.save(jugador);
    return JugadorMapper.aResponse(jugador);
  }

  // Eliminar físicamente: solo si no tiene datos asociados (sección 6.4).
  async eliminar(id: number): Promise<void> {
    const jugador = await this.buscarEntidad(id);

    // Regla de negocio: no se borra si tiene contratos. Cuenta activos E históricos: cualquier fila de
    // equipo_jugador lo impide (6.4), porque borrar al jugador rompería el historial de traspasos.
    // countBy (y no existsBy) porque el mensaje dice CUÁNTOS contratos tiene.
    const cantidadContratos = await this.equipoJugadorRepository.countBy({
      jugador: { id },
    });
    if (cantidadContratos > 0) {
      throw new ApplicationException(
        ErrorCase.HAS_ASSOCIATIONS,
        `No se puede eliminar el jugador porque tiene ${cantidadContratos} contrato(s) registrado(s) con equipos. Puede desactivarlo.`,
      );
    }

    // Regla de negocio: no se borra si tiene habilidades asignadas (habilidad_jugador, de C: solo se cuenta).
    const cantidadHabilidades = await this.habilidadJugadorRepository.countBy({
      jugador: { id },
    });
    if (cantidadHabilidades > 0) {
      throw new ApplicationException(
        ErrorCase.HAS_ASSOCIATIONS,
        `No se puede eliminar el jugador porque tiene ${cantidadHabilidades} habilidad(es) asignada(s). Puede desactivarlo.`,
      );
    }

    // Regla de negocio: no se borra si tiene anotaciones en partidos (se perdería quién las hizo).
    const cantidadAnotaciones = await this.anotacionRepository.countBy({
      jugador: { id },
    });
    if (cantidadAnotaciones > 0) {
      throw new ApplicationException(
        ErrorCase.HAS_ASSOCIATIONS,
        `No se puede eliminar el jugador porque tiene ${cantidadAnotaciones} anotación(es) registrada(s) en partidos. Puede desactivarlo.`,
      );
    }
    // La FK (NO ACTION) es la última red: MySQL rechaza el DELETE y el filtro de A lo traduce a 409.

    await this.jugadorRepository.remove(jugador);
  }

  // Busca la entidad o lanza NOT_FOUND. La reutilizan obtener, actualizar, cambiarEstado y eliminar.
  private async buscarEntidad(id: number): Promise<Jugador> {
    const jugador = await this.jugadorRepository.findOneBy({ id });
    if (!jugador) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe el jugador con id ${id}`,
      );
    }
    return jugador;
  }

  // Regla de negocio: la fecha de nacimiento debe ser pasada (hoy NO vale). La usan crear y actualizar.
  // Las fechas "yyyy-MM-dd" se comparan como texto: el año va primero y todo tiene ceros a la izquierda.
  private validarFechaNacimiento(fechaNacimiento: string): void {
    if (fechaNacimiento >= hoyBogota()) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        'La fecha de nacimiento debe ser anterior a hoy',
      );
    }
  }
}
