import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
// TODO: verificar rutas cuando A suba common/errores (ACUERDOS 5.3 y 13.1)
import { ApplicationException } from '../common/errores/application.exception';
import { ErrorCase } from '../common/errores/error-case.enum';
// Entidades AJENAS: SOLO lectura (ACUERDOS 7 y 13.3). Nunca save/update/delete ni inyectar sus services.
// TODO: Equipo, Torneo e Inscripcion son de A (compilan cuando A suba sus entidades)
import type { Equipo } from '../equipo/entities/equipo.entity';
import { Fase, FaseFinal } from '../fase/entities/fase.entity';
import { GrupoEquipo } from '../fase/entities/grupo-equipo.entity';
import { construirRondasLlaves } from '../fase/utils/llaves-fase-final';
import { calcularTablaPosiciones } from '../fase/utils/tabla-posiciones';
import {
  EstadoPartido,
  tieneResultado,
} from '../partido/entities/estado-partido.enum';
import { Partido } from '../partido/entities/partido.entity';
import { Inscripcion } from '../torneo/entities/inscripcion.entity';
import { Torneo } from '../torneo/entities/torneo.entity';
import {
  DesarrolloTorneoResponseDto,
  FaseDesarrolloDto,
  ResumenDesarrolloDto,
} from './dto/desarrollo-torneo-response.dto';
import { DesarrolloMapper } from './mappers/desarrollo.mapper';

// HU-GC-08 · ACUERDOS 7 y 9.17. Consulta consolidada de solo lectura del desarrollo de un torneo.
// Las anotaciones de cada partido no vienen aquí: el front las consulta en GET /api/partidos/{id}/anotaciones.
@Injectable()
export class DesarrolloService {
  constructor(
    // De A, solo lectura.
    @InjectRepository(Torneo)
    private readonly torneoRepository: Repository<Torneo>,
    @InjectRepository(Inscripcion)
    private readonly inscripcionRepository: Repository<Inscripcion>,
    // De C, solo lectura.
    @InjectRepository(Fase)
    private readonly faseRepository: Repository<Fase>,
    @InjectRepository(GrupoEquipo)
    private readonly grupoEquipoRepository: Repository<GrupoEquipo>,
    // De B, solo lectura.
    @InjectRepository(Partido)
    private readonly partidoRepository: Repository<Partido>,
  ) {}

  // GET /api/torneos/{torneoId}/desarrollo
  async obtenerDesarrollo(
    torneoId: number,
  ): Promise<DesarrolloTorneoResponseDto> {
    const torneo = await this.torneoRepository.findOne({
      where: { id: torneoId },
      relations: { deporte: true },
    });
    if (!torneo) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe el torneo con id ${torneoId}`,
      );
    }

    const [cantidadInscritos, fases] = await Promise.all([
      this.inscripcionRepository.countBy({ torneo: { id: torneoId } }),
      this.faseRepository.find({
        where: { torneo: { id: torneoId } },
        order: { orden: 'ASC', nombre: 'ASC', id: 'ASC' },
      }),
    ]);

    if (fases.length === 0) {
      return DesarrolloMapper.aResponse(
        torneo,
        cantidadInscritos,
        { totalPartidos: 0, conResultado: 0, pendientes: 0 },
        [],
      );
    }

    const faseIds = fases.map((fase) => fase.id);
    const grupoIds = fases
      .filter((fase) => !(fase instanceof FaseFinal))
      .map((fase) => fase.id);

    const [asignacionesGrupo, partidos] = await Promise.all([
      grupoIds.length > 0
        ? this.grupoEquipoRepository.find({
            where: { grupo: { id: In(grupoIds) } },
            relations: { grupo: true, equipo: true },
          })
        : Promise.resolve([]),
      this.partidoRepository.find({
        where: { fase: { id: In(faseIds) } },
        relations: { fase: true, equipoLocal: true, equipoVisitante: true },
        order: { fechaHora: 'ASC', id: 'ASC' },
      }),
    ]);

    const equiposPorGrupo = new Map<number, Equipo[]>();
    for (const asignacion of asignacionesGrupo) {
      const lista = equiposPorGrupo.get(asignacion.grupo.id) ?? [];
      lista.push(asignacion.equipo);
      equiposPorGrupo.set(asignacion.grupo.id, lista);
    }

    const partidosPorFase = new Map<number, Partido[]>();
    for (const partido of partidos) {
      const lista = partidosPorFase.get(partido.fase.id) ?? [];
      lista.push(partido);
      partidosPorFase.set(partido.fase.id, lista);
    }

    const resumen = this.calcularResumen(partidos);

    const fasesDesarrollo: FaseDesarrolloDto[] = fases.map((fase) => {
      const partidosFase = partidosPorFase.get(fase.id) ?? [];

      if (fase instanceof FaseFinal) {
        const llaves = construirRondasLlaves(
          fase.cantidadEquipos,
          Boolean(fase.tercerPuesto),
          partidosFase,
        );
        return DesarrolloMapper.aFaseFinalDesarrollo(
          fase,
          llaves,
          partidosFase,
        );
      }

      const equiposGrupo = equiposPorGrupo.get(fase.id) ?? [];
      const tablaPosiciones = calcularTablaPosiciones(
        equiposGrupo,
        partidosFase,
      );
      return DesarrolloMapper.aFaseGrupoDesarrollo(
        fase,
        equiposGrupo,
        tablaPosiciones,
        partidosFase,
      );
    });

    return DesarrolloMapper.aResponse(
      torneo,
      cantidadInscritos,
      resumen,
      fasesDesarrollo,
    );
  }

  // Resumen global de partidos del torneo:
  // - conResultado: partidos con marcadorLocal y marcadorVisitante registrados.
  // - pendientes: partidos sin resultado que NO estén CANCELADO.
  private calcularResumen(partidos: Partido[]): ResumenDesarrolloDto {
    let conResultado = 0;
    let pendientes = 0;

    for (const partido of partidos) {
      if (tieneResultado(partido)) {
        conResultado += 1;
      } else if (partido.estado !== EstadoPartido.CANCELADO) {
        pendientes += 1;
      }
    }

    return {
      totalPartidos: partidos.length,
      conResultado,
      pendientes,
    };
  }
}
