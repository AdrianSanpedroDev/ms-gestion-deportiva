import { Test } from '@nestjs/testing';
import { EstadoTorneo } from '../torneo/entities/estado-torneo.enum';
import { FaseResponseDto } from './dto/fase-response.dto';
import { TipoFase } from './entities/tipo-fase.enum';
import { FaseController } from './fase.controller';
import { FaseService } from './fase.service';

const faseResponseEjemplo: FaseResponseDto = {
  id: 3,
  torneo: { id: 1, nombre: 'Copa Caldas 2026', estado: EstadoTorneo.EN_CURSO },
  nombre: 'Grupo A',
  tipo: TipoFase.GRUPO,
  orden: 1,
  cantidadEquipos: 4,
  tercerPuesto: null,
  cantidadPartidos: 6,
};

describe('FaseController', () => {
  let controller: FaseController;
  const serviceMock = {
    listarPorTorneo: jest.fn(),
    obtener: jest.fn(),
    actualizar: jest.fn(),
    eliminar: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const modulo = await Test.createTestingModule({
      controllers: [FaseController],
      providers: [{ provide: FaseService, useValue: serviceMock }],
    }).compile();

    controller = modulo.get(FaseController);
  });

  it('delega GET /torneos/:torneoId/fases a listarPorTorneo', async () => {
    serviceMock.listarPorTorneo.mockResolvedValue([faseResponseEjemplo]);

    const resultado = await controller.listarPorTorneo(1);

    expect(serviceMock.listarPorTorneo).toHaveBeenCalledWith(1);
    expect(resultado).toEqual([faseResponseEjemplo]);
  });

  it('delega GET /fases/:id a obtener', async () => {
    serviceMock.obtener.mockResolvedValue(faseResponseEjemplo);

    const resultado = await controller.obtener(3);

    expect(serviceMock.obtener).toHaveBeenCalledWith(3);
    expect(resultado).toEqual(faseResponseEjemplo);
  });

  it('delega PATCH /fases/:id a actualizar', async () => {
    serviceMock.actualizar.mockResolvedValue(faseResponseEjemplo);

    const resultado = await controller.actualizar(3, {
      nombre: 'Grupo A',
      orden: 1,
    });

    expect(serviceMock.actualizar).toHaveBeenCalledWith(3, {
      nombre: 'Grupo A',
      orden: 1,
    });
    expect(resultado).toEqual(faseResponseEjemplo);
  });

  it('delega DELETE /fases/:id a eliminar', async () => {
    serviceMock.eliminar.mockResolvedValue(undefined);

    await controller.eliminar(3);

    expect(serviceMock.eliminar).toHaveBeenCalledWith(3);
  });
});
