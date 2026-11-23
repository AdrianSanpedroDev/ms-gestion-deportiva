import { DataSource } from 'typeorm';
import { TipoFase } from '../entities/tipo-fase.enum';
import { FaseRepository } from './fase.repository';

describe('FaseRepository', () => {
  const query = jest.fn();
  const repository = new FaseRepository({ query } as unknown as DataSource);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('contarPartidosPorFase', () => {
    it('retorna Map vacío sin consultar la BD si no hay ids', async () => {
      const resultado = await repository.contarPartidosPorFase([]);

      expect(resultado.size).toBe(0);
      expect(query).not.toHaveBeenCalled();
    });

    it('convierte filas agrupadas a Map numérico usando SQL parametrizado', async () => {
      query.mockResolvedValue([
        { faseId: '3', cantidad: '6' },
        { faseId: 8, cantidad: 2 },
      ]);

      const resultado = await repository.contarPartidosPorFase([3, 8]);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE fase_id IN (?)'),
        [[3, 8]],
      );
      expect(resultado.get(3)).toBe(6);
      expect(resultado.get(8)).toBe(2);
    });
  });

  describe('contarEquiposPorGrupo', () => {
    it('retorna Map vacío sin consultar la BD si no hay ids', async () => {
      const resultado = await repository.contarEquiposPorGrupo([]);

      expect(resultado.size).toBe(0);
      expect(query).not.toHaveBeenCalled();
    });

    it('convierte filas agrupadas de grupo_equipo a Map numérico', async () => {
      query.mockResolvedValue([{ grupoId: '3', cantidad: '4' }]);

      const resultado = await repository.contarEquiposPorGrupo([3]);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE grupo_id IN (?)'),
        [[3]],
      );
      expect(resultado.get(3)).toBe(4);
    });
  });

  describe('existeConflictoEquipoEnOrden', () => {
    it('retorna true cuando encuentra al menos un equipo duplicado en el mismo orden', async () => {
      query.mockResolvedValue([{ conflicto: 1 }]);

      const resultado = await repository.existeConflictoEquipoEnOrden(3, 1, 2);

      expect(resultado).toBe(true);
      expect(query).toHaveBeenCalledWith(expect.stringContaining('LIMIT 1'), [
        3,
        1,
        TipoFase.GRUPO,
        2,
      ]);
    });

    it('retorna false cuando no hay conflictos', async () => {
      query.mockResolvedValue([]);

      const resultado = await repository.existeConflictoEquipoEnOrden(3, 1, 2);

      expect(resultado).toBe(false);
    });
  });
});
