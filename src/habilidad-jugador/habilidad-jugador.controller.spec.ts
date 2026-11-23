import { HTTP_CODE_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CategoriaHabilidad } from '../habilidad/entities/categoria-habilidad.enum';
import { TipoDocumento } from '../jugador/entities/tipo-documento.enum';
import { HabilidadJugadorController } from './habilidad-jugador.controller';
import { HabilidadJugadorService } from './habilidad-jugador.service';

describe('HabilidadJugadorController', () => {
  let controller: HabilidadJugadorController;

  const serviceMock = {
    asignar: jest.fn(),
    listarHabilidadesPorJugador: jest.fn(),
    listarJugadoresPorHabilidad: jest.fn(),
    retirar: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const modulo = await Test.createTestingModule({
      controllers: [HabilidadJugadorController],
      providers: [{ provide: HabilidadJugadorService, useValue: serviceMock }],
    }).compile();

    controller = modulo.get(HabilidadJugadorController);
  });

  it('delega asignar en el service y devuelve HabilidadResumen', async () => {
    const resumen = {
      id: 2,
      nombre: 'Regate',
      categoria: CategoriaHabilidad.TECNICA,
    };
    serviceMock.asignar.mockResolvedValue(resumen);

    const resultado = await controller.asignar(7, { habilidadId: 2 });

    expect(serviceMock.asignar).toHaveBeenCalledWith(7, { habilidadId: 2 });
    expect(resultado).toEqual(resumen);
  });

  it('delega listarHabilidadesPorJugador en el service', async () => {
    const lista = [
      { id: 2, nombre: 'Regate', categoria: CategoriaHabilidad.TECNICA },
    ];
    serviceMock.listarHabilidadesPorJugador.mockResolvedValue(lista);

    const resultado = await controller.listarHabilidadesPorJugador(7);

    expect(serviceMock.listarHabilidadesPorJugador).toHaveBeenCalledWith(7);
    expect(resultado).toEqual(lista);
  });

  it('delega listarJugadoresPorHabilidad en el service', async () => {
    const lista = [
      {
        id: 7,
        tipoDocumento: TipoDocumento.CC,
        numeroDocumento: '1053000000',
        nombreCompleto: 'Juan Pérez',
        activo: true,
      },
    ];
    serviceMock.listarJugadoresPorHabilidad.mockResolvedValue(lista);

    const resultado = await controller.listarJugadoresPorHabilidad(2);

    expect(serviceMock.listarJugadoresPorHabilidad).toHaveBeenCalledWith(2);
    expect(resultado).toEqual(lista);
  });

  it('delega retirar en el service y define HTTP 204 No Content', async () => {
    serviceMock.retirar.mockResolvedValue(undefined);

    await expect(controller.retirar(7, 2)).resolves.toBeUndefined();
    expect(serviceMock.retirar).toHaveBeenCalledWith(7, 2);

    const httpCode = Reflect.getMetadata(
      HTTP_CODE_METADATA,
      HabilidadJugadorController.prototype.retirar,
    );
    expect(httpCode).toBe(HttpStatus.NO_CONTENT);
  });

  it('declara las rutas exactas del contrato (ACUERDOS 9.12)', () => {
    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        HabilidadJugadorController.prototype.asignar,
      ),
    ).toBe('jugadores/:jugadorId/habilidades');
    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        HabilidadJugadorController.prototype.listarHabilidadesPorJugador,
      ),
    ).toBe('jugadores/:jugadorId/habilidades');
    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        HabilidadJugadorController.prototype.listarJugadoresPorHabilidad,
      ),
    ).toBe('habilidades/:habilidadId/jugadores');
    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        HabilidadJugadorController.prototype.retirar,
      ),
    ).toBe('jugadores/:jugadorId/habilidades/:habilidadId');
  });
});
