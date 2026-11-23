import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Not, Repository } from 'typeorm';
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
import { HabilidadJugador } from '../habilidad-jugador/entities/habilidad-jugador.entity';
// Se reutiliza el helper de jugador (mismo dueño, B): no se copia.
import { escaparLike } from '../jugador/utils/consultas';
import { ActualizarHabilidadDto } from './dto/actualizar-habilidad.dto';
import { CrearHabilidadDto } from './dto/crear-habilidad.dto';
import { FiltrosHabilidadDto } from './dto/filtros-habilidad.dto';
import { HabilidadResponseDto } from './dto/habilidad-response.dto';
import { Habilidad } from './entities/habilidad.entity';
import { HabilidadMapper } from './mappers/habilidad.mapper';

@Injectable()
export class HabilidadService {
  constructor(
    @InjectRepository(Habilidad)
    private readonly habilidadRepository: Repository<Habilidad>,
    // HabilidadJugador es de C: SOLO lectura (countBy) para decidir si la habilidad se puede eliminar.
    @InjectRepository(HabilidadJugador)
    private readonly habilidadJugadorRepository: Repository<HabilidadJugador>,
  ) {}

  async crear(dto: CrearHabilidadDto): Promise<HabilidadResponseDto> {
    // Regla de negocio: no duplicados por nombre. La collation de MySQL ya ignora mayúsculas y tildes (5.4).
    const yaExiste = await this.habilidadRepository.existsBy({
      nombre: dto.nombre,
    });
    if (yaExiste) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `Ya existe una habilidad con el nombre '${dto.nombre}'`,
      );
    }

    // Crear (sin tocar la BD), guardar (INSERT) y responder con el DTO, nunca con la entidad.
    const habilidad = this.habilidadRepository.create(
      HabilidadMapper.aDatosEntidad(dto),
    );
    await this.habilidadRepository.save(habilidad);
    return HabilidadMapper.aResponse(habilidad);
  }

  async listar(filtros: FiltrosHabilidadDto): Promise<HabilidadResponseDto[]> {
    // Un solo objeto "where" = condiciones con AND. Cada filtro se agrega solo si viene.
    const where: FindOptionsWhere<Habilidad> = {};

    if (filtros.nombre) {
      // Se escapan los comodines de LIKE (% y _) para que nombre="_" busque un guion bajo y no "cualquier cosa".
      const texto = escaparLike(filtros.nombre);
      where.nombre = Like(`%${texto}%`); // va como parámetro (?): no hay inyección
    }

    if (filtros.categoria) {
      where.categoria = filtros.categoria;
    }

    const habilidades = await this.habilidadRepository.find({
      where,
      order: { nombre: 'ASC' },
    });
    return habilidades.map((habilidad) => HabilidadMapper.aResponse(habilidad));
  }

  async obtener(id: number): Promise<HabilidadResponseDto> {
    const habilidad = await this.buscarEntidad(id);
    return HabilidadMapper.aResponse(habilidad);
  }

  async actualizar(
    id: number,
    dto: ActualizarHabilidadDto,
  ): Promise<HabilidadResponseDto> {
    const habilidad = await this.buscarEntidad(id);

    // Duplicado: OTRA habilidad (id distinto) con el mismo nombre.
    // Sin el Not(id), editar solo la descripción de "Regate" la encontraría a ella misma y daría un 409 falso.
    const otraConEseNombre = await this.habilidadRepository.existsBy({
      nombre: dto.nombre,
      id: Not(id),
    });
    if (otraConEseNombre) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `Ya existe otra habilidad con el nombre '${dto.nombre}'`,
      );
    }

    // merge copia los campos del DTO sobre la entidad; save con id = UPDATE.
    this.habilidadRepository.merge(
      habilidad,
      HabilidadMapper.aDatosEntidad(dto),
    );
    await this.habilidadRepository.save(habilidad);
    return HabilidadMapper.aResponse(habilidad);
  }

  // Eliminar físicamente: solo si ningún jugador la tiene asignada (sección 6.6).
  async eliminar(id: number): Promise<void> {
    const habilidad = await this.buscarEntidad(id);

    // Regla de negocio: no se borra si algún jugador la tiene asignada (6.6).
    // countBy (y no existsBy) porque el mensaje dice a CUÁNTOS jugadores.
    const cantidadJugadores = await this.habilidadJugadorRepository.countBy({
      habilidad: { id },
    });
    if (cantidadJugadores > 0) {
      throw new ApplicationException(
        ErrorCase.HAS_ASSOCIATIONS,
        `No se puede eliminar la habilidad '${habilidad.nombre}' porque está asignada a ${cantidadJugadores} jugador(es)`,
      );
    }
    // La FK (NO ACTION) es la última red: MySQL rechaza el DELETE y el filtro de A lo traduce a 409.

    await this.habilidadRepository.remove(habilidad);
  }

  // Busca la entidad o lanza NOT_FOUND. La reutilizan obtener, actualizar y eliminar.
  private async buscarEntidad(id: number): Promise<Habilidad> {
    const habilidad = await this.habilidadRepository.findOneBy({ id });
    if (!habilidad) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe la habilidad con id ${id}`,
      );
    }
    return habilidad;
  }
}
