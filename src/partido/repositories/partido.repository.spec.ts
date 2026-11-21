import { PartidoRepository } from './partido.repository';

describe('PartidoRepository.contarAnotacionesPorPartido', () => {
  const dataSource = { query: jest.fn() };
  let repo: PartidoRepository;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = new PartidoRepository(dataSource as never);
  });

  it('con 0 ids devuelve un Map vacío y NO consulta la BD', async () => {
    const r = await repo.contarAnotacionesPorPartido([]);
    expect(r.size).toBe(0);
    expect(dataSource.query).not.toHaveBeenCalled();
  });

  it('con ids usa SQL parametrizado (?) y pasa los ids como parámetro, sin concatenar', async () => {
    dataSource.query.mockResolvedValue([]);
    await repo.contarAnotacionesPorPartido([20, 21]);

    const [sql, params] = dataSource.query.mock.calls[0];
    expect(sql).toContain('?');
    expect(sql).not.toMatch(/20|21/);
    expect(params).toEqual([[20, 21]]);
  });

  it('arma el Map partidoId → cantidad, aunque el driver devuelva texto', async () => {
    dataSource.query.mockResolvedValue([
      { partidoId: 20, cantidad: 3 },
      { partidoId: '21', cantidad: '2' },
    ]);
    const r = await repo.contarAnotacionesPorPartido([20, 21, 22]);
    expect(r.get(20)).toBe(3);
    expect(r.get(21)).toBe(2);
  });

  it('los partidos sin anotaciones no salen en el Map (el service los lee como 0)', async () => {
    dataSource.query.mockResolvedValue([{ partidoId: 20, cantidad: 3 }]);
    const r = await repo.contarAnotacionesPorPartido([20, 22]);
    expect(r.has(22)).toBe(false);
    expect(r.get(22) ?? 0).toBe(0);
  });
});
