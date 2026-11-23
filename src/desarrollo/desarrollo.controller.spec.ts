// Mocks virtuales temporales para resolver imports del service cuando aún no existen common/errores y entidades de A (DT-C4).
jest.mock('../common/errores/error-case.enum', () => ({ ErrorCase: {} }), {
  virtual: true,
});
jest.mock(
  '../common/errores/application.exception',
  () => ({ ApplicationException: class ApplicationException extends Error {} }),
  { virtual: true },
);
jest.mock(
  '../torneo/entities/estado-torneo.enum',
  () => ({
    EstadoTorneo: {
      EN_CURSO: 'EN_CURSO',
    },
  }),
  { virtual: true },
);
jest.mock(
  '../torneo/entities/torneo.entity',
  () => ({ Torneo: class Torneo {} }),
  { virtual: true },
);
jest.mock(
  '../torneo/entities/inscripcion.entity',
  () => ({ Inscripcion: class Inscripcion {} }),
  { virtual: true },
);
jest.mock(
  '../equipo/entities/equipo.entity',
  () => ({ Equipo: class Equipo {} }),
  { virtual: true },
);
jest.mock(
  '../escenario/entities/escenario.entity',
  () => ({ Escenario: class Escenario {} }),
  { virtual: true },
);

import { PATH_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { EstadoTorneo } from '../torneo/entities/estado-torneo.enum';
import { DesarrolloController } from './desarrollo.controller';
import { DesarrolloService } from './desarrollo.service';
import { DesarrolloTorneoResponseDto } from './dto/desarrollo-torneo-response.dto';

describe('DesarrolloController (HU-GC-08)', () => {
  let controller: DesarrolloController;

  const serviceMock = {
    obtenerDesarrollo: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const modulo = await Test.createTestingModule({
      controllers: [DesarrolloController],
      providers: [{ provide: DesarrolloService, useValue: serviceMock }],
    }).compile();

    controller = modulo.get(DesarrolloController);
  });

  it('delega obtenerDesarrollo en el service y devuelve DesarrolloTorneoResponseDto', async () => {
    const respuesta: DesarrolloTorneoResponseDto = {
      torneo: {
        id: 1,
        nombre: 'Copa Caldas 2026',
        deporte: { id: 1, nombre: 'Fútbol', activo: true },
        fechaInicio: '2026-12-01',
        fechaFin: '2026-12-20',
        estado: EstadoTorneo.EN_CURSO,
        cantidadInscritos: 8,
      },
      resumen: { totalPartidos: 14, conResultado: 9, pendientes: 5 },
      fases: [],
    };
    serviceMock.obtenerDesarrollo.mockResolvedValue(respuesta);

    const resultado = await controller.obtenerDesarrollo(1);

    expect(serviceMock.obtenerDesarrollo).toHaveBeenCalledWith(1);
    expect(resultado).toEqual(respuesta);
  });

  it('declara la ruta exacta del contrato (ACUERDOS 9.17: GET /api/torneos/:torneoId/desarrollo)', () => {
    expect(Reflect.getMetadata(PATH_METADATA, DesarrolloController)).toBe(
      'torneos',
    );
    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        DesarrolloController.prototype.obtenerDesarrollo,
      ),
    ).toBe(':torneoId/desarrollo');
  });
});
