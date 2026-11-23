import { Test } from '@nestjs/testing';
import { FaseFinalController } from './fase-final.controller';
import { FaseFinalService } from './fase-final.service';

describe('FaseFinalController (HU-GC-05)', () => {
  let controller: FaseFinalController;
  let faseFinalService: Record<string, jest.Mock>;

  beforeEach(async () => {
    faseFinalService = {
      crear: jest.fn(),
      obtenerPorTorneo: jest.fn(),
      actualizar: jest.fn(),
      eliminar: jest.fn(),
      obtenerLlaves: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [FaseFinalController],
      providers: [{ provide: FaseFinalService, useValue: faseFinalService }],
    }).compile();

    controller = moduleRef.get(FaseFinalController);
  });

  it('delega los 5 endpoints de fase final a FaseFinalService', async () => {
    const dto = {
      nombre: 'Fase final',
      orden: 2,
      cantidadEquipos: 4,
      tercerPuesto: true,
    };
    const respuestaFase = { id: 8, nombre: 'Fase final' };
    const respuestaLlaves = { fase: { id: 8 }, rondas: [] };

    faseFinalService.crear.mockResolvedValue(respuestaFase);
    faseFinalService.obtenerPorTorneo.mockResolvedValue(respuestaFase);
    faseFinalService.actualizar.mockResolvedValue(respuestaFase);
    faseFinalService.eliminar.mockResolvedValue(undefined);
    faseFinalService.obtenerLlaves.mockResolvedValue(respuestaLlaves);

    expect(await controller.crear(1, dto)).toBe(respuestaFase);
    expect(faseFinalService.crear).toHaveBeenCalledWith(1, dto);

    expect(await controller.obtenerPorTorneo(1)).toBe(respuestaFase);
    expect(faseFinalService.obtenerPorTorneo).toHaveBeenCalledWith(1);

    expect(await controller.actualizar(8, dto)).toBe(respuestaFase);
    expect(faseFinalService.actualizar).toHaveBeenCalledWith(8, dto);

    await controller.eliminar(8);
    expect(faseFinalService.eliminar).toHaveBeenCalledWith(8);

    expect(await controller.obtenerLlaves(8)).toBe(respuestaLlaves);
    expect(faseFinalService.obtenerLlaves).toHaveBeenCalledWith(8);
  });
});
