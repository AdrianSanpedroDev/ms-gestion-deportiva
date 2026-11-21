import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// Repositorio propio de B (ACUERDOS 3 y 4.1): solo para SQL especial que Repository<T> no hace bien.
// Es el ÚNICO lugar de partido/ con SQL escrito a mano, y siempre con parámetros (?), nunca concatenado.
@Injectable()
export class PartidoRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  // Cuenta las anotaciones de VARIOS partidos en UNA sola consulta (evita N+1: con 50 partidos,
  // countBy uno por uno serían 50 consultas más). Devuelve un Map partidoId → cantidad.
  // Los partidos sin anotaciones no salen en el GROUP BY: el service usa "?? 0".
  async contarAnotacionesPorPartido(
    partidoIds: number[],
  ): Promise<Map<number, number>> {
    const conteo = new Map<number, number>();
    // "IN ()" vacío es SQL inválido: sin partidos no hay nada que contar.
    if (partidoIds.length === 0) {
      return conteo;
    }

    // "IN (?)" con un arreglo: mysql2 lo expande a "IN (1, 2, 3)" escapando cada valor.
    const filas: { partidoId: number | string; cantidad: number | string }[] =
      await this.dataSource.query(
        'SELECT partido_id AS partidoId, COUNT(*) AS cantidad FROM anotacion WHERE partido_id IN (?) GROUP BY partido_id',
        [partidoIds],
      );

    // Number(...) por si el driver devuelve el COUNT como texto.
    for (const fila of filas) {
      conteo.set(Number(fila.partidoId), Number(fila.cantidad));
    }
    return conteo;
  }
}
