import { Escenario } from './entities/escenario.entity';
import { EscenarioService } from './escenario.service';

describe('EscenarioService', () => {
  it('lista escenarios ordenados por nombre devolviendo solo { id, nombre }', async () => {
    const repo = {
      find: jest.fn().mockResolvedValue([
        {
          id: 1,
          nombre: 'Coliseo Mayor',
          direccion: 'Av. Paralela',
          capacidad: 3000,
        } as Escenario,
        {
          id: 2,
          nombre: 'Estadio Palogrande',
          direccion: 'Cra 23',
          capacidad: 28000,
        } as Escenario,
      ]),
    };

    const service = new EscenarioService(repo as never);
    const res = await service.listar();

    expect(repo.find).toHaveBeenCalledWith({ order: { nombre: 'ASC' } });
    expect(res).toEqual([
      { id: 1, nombre: 'Coliseo Mayor' },
      { id: 2, nombre: 'Estadio Palogrande' },
    ]);
  });
});
