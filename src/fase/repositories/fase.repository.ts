import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TipoFase } from '../entities/tipo-fase.enum';

// Repositorio propio de fase/ (ACUERDOS 3, 4.1 y 7): SQL parametrizado para conteos en lote
// (evita N+1) y validaciones cruzadas de solo lectura sobre tablas de fases y partidos.
@Injectable()
export class FaseRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  // Cuenta partidos agrupados por fase_id en una sola consulta (tabla partido de B, solo lectura).
  async contarPartidosPorFase(faseIds: number[]): Promise<Map<number, number>> {
    const conteo = new Map<number, number>();
    if (faseIds.length === 0) {
      return conteo;
    }

    const filas: { faseId: number | string; cantidad: number | string }[] =
      await this.dataSource.query(
        'SELECT fase_id AS faseId, COUNT(*) AS cantidad FROM partido WHERE fase_id IN (?) GROUP BY fase_id',
        [faseIds],
      );

    for (const fila of filas) {
      conteo.set(Number(fila.faseId), Number(fila.cantidad));
    }
    return conteo;
  }

  // Cuenta equipos asignados a cada grupo en una sola consulta (tabla grupo_equipo de C).
  async contarEquiposPorGrupo(
    grupoIds: number[],
  ): Promise<Map<number, number>> {
    const conteo = new Map<number, number>();
    if (grupoIds.length === 0) {
      return conteo;
    }

    const filas: { grupoId: number | string; cantidad: number | string }[] =
      await this.dataSource.query(
        'SELECT grupo_id AS grupoId, COUNT(*) AS cantidad FROM grupo_equipo WHERE grupo_id IN (?) GROUP BY grupo_id',
        [grupoIds],
      );

    for (const fila of filas) {
      conteo.set(Number(fila.grupoId), Number(fila.cantidad));
    }
    return conteo;
  }

  // Verifica si algún equipo del grupo ya pertenece a otro grupo del mismo torneo con el nuevo orden
  // (ACUERDOS 6.11: un equipo no puede estar en dos grupos del mismo torneo con el mismo orden).
  async existeConflictoEquipoEnOrden(
    grupoId: number,
    torneoId: number,
    nuevoOrden: number,
  ): Promise<boolean> {
    const filas: { conflicto: number | string }[] = await this.dataSource.query(
      `SELECT 1 AS conflicto
       FROM grupo_equipo ge1
       INNER JOIN grupo_equipo ge2
         ON ge1.equipo_id = ge2.equipo_id
        AND ge2.grupo_id <> ge1.grupo_id
       INNER JOIN fase f2
         ON f2.id = ge2.grupo_id
       WHERE ge1.grupo_id = ?
         AND f2.torneo_id = ?
         AND f2.tipo = ?
         AND f2.orden = ?
       LIMIT 1`,
      [grupoId, torneoId, TipoFase.GRUPO, nuevoOrden],
    );

    return filas.length > 0;
  }
}
