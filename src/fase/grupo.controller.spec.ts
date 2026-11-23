// =====================================================================================
// TEMPORAL: quitar los jest.mock virtuales cuando A suba common/errores, torneo/entities,
// equipo/entities y escenario/entities (DT-C4).
// =====================================================================================
jest.mock(
  '../common/errores/error-case.enum',
  () => ({ ErrorCase: { NOT_FOUND: 'NOT_FOUND' } }),
  { virtual: true },
);
jest.mock(
  '../common/errores/application.exception',
  () => ({ ApplicationException: class ApplicationException extends Error {} }),
  { virtual: true },
);
jest.mock(
  '../torneo/entities/estado-torneo.enum',
  () => ({ EstadoTorneo: { EN_CURSO: 'EN_CURSO' } }),
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

import { Test } from '@nestjs/testing';
import type { FilaPosicionDto } from './dto/fila-posicion.dto';
import type { GrupoResponseDto } from './dto/grupo-response.dto';
import { GrupoController } from './grupo.controller';
import { GrupoService } from './grupo.service';

const grupoEjemplo: GrupoResponseDto = {
  id: 3,
  torneo: { id: 1, nombre: 'Copa Caldas 2026', estado: 'EN_CURSO' },
  nombre: 'Grupo A',
  orden: 1,
  equipos: [{ id: 4, nombre: 'Once Caldas', activo: true }],
};

const filaEjemplo: FilaPosicionDto = {
  posicion: 1,
  equipo: { id: 4, nombre: 'Once Caldas', activo: true },
  jugados: 1,
  ganados: 1,
  empatados: 0,
  perdidos: 0,
  aFavor: 2,
  enContra: 1,
  diferencia: 1,
  puntos: 3,
};

describe('GrupoController', () => {
  let controller: GrupoController;
  const serviceMock = {
    crear: jest.fn(),
    listarPorTorneo: jest.fn(),
    obtener: jest.fn(),
    actualizar: jest.fn(),
    eliminar: jest.fn(),
    asignarEquipos: jest.fn(),
    listarEquipos: jest.fn(),
    retirarEquipo: jest.fn(),
    obtenerTablaPosiciones: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const modulo = await Test.createTestingModule({
      controllers: [GrupoController],
      providers: [{ provide: GrupoService, useValue: serviceMock }],
    }).compile();

    controller = modulo.get(GrupoController);
  });

  it('delega POST /torneos/:torneoId/grupos a crear', async () => {
    serviceMock.crear.mockResolvedValue(grupoEjemplo);

    const res = await controller.crear(1, { nombre: 'Grupo A', orden: 1 });

    expect(serviceMock.crear).toHaveBeenCalledWith(1, {
      nombre: 'Grupo A',
      orden: 1,
    });
    expect(res).toEqual(grupoEjemplo);
  });

  it('delega GET /torneos/:torneoId/grupos a listarPorTorneo', async () => {
    serviceMock.listarPorTorneo.mockResolvedValue([grupoEjemplo]);

    const res = await controller.listarPorTorneo(1, { orden: 1 });

    expect(serviceMock.listarPorTorneo).toHaveBeenCalledWith(1, { orden: 1 });
    expect(res).toEqual([grupoEjemplo]);
  });

  it('delega GET /grupos/:id a obtener', async () => {
    serviceMock.obtener.mockResolvedValue(grupoEjemplo);

    const res = await controller.obtener(3);

    expect(serviceMock.obtener).toHaveBeenCalledWith(3);
    expect(res).toEqual(grupoEjemplo);
  });

  it('delega PUT /grupos/:id a actualizar', async () => {
    serviceMock.actualizar.mockResolvedValue(grupoEjemplo);

    const res = await controller.actualizar(3, { nombre: 'Grupo A', orden: 1 });

    expect(serviceMock.actualizar).toHaveBeenCalledWith(3, {
      nombre: 'Grupo A',
      orden: 1,
    });
    expect(res).toEqual(grupoEjemplo);
  });

  it('delega DELETE /grupos/:id a eliminar', async () => {
    serviceMock.eliminar.mockResolvedValue(undefined);

    await controller.eliminar(3);

    expect(serviceMock.eliminar).toHaveBeenCalledWith(3);
  });

  it('delega POST /grupos/:grupoId/equipos a asignarEquipos', async () => {
    serviceMock.asignarEquipos.mockResolvedValue(grupoEjemplo.equipos);

    const res = await controller.asignarEquipos(3, { equipoIds: [4] });

    expect(serviceMock.asignarEquipos).toHaveBeenCalledWith(3, {
      equipoIds: [4],
    });
    expect(res).toEqual(grupoEjemplo.equipos);
  });

  it('delega GET /grupos/:grupoId/equipos a listarEquipos', async () => {
    serviceMock.listarEquipos.mockResolvedValue(grupoEjemplo.equipos);

    const res = await controller.listarEquipos(3);

    expect(serviceMock.listarEquipos).toHaveBeenCalledWith(3);
    expect(res).toEqual(grupoEjemplo.equipos);
  });

  it('delega DELETE /grupos/:grupoId/equipos/:equipoId a retirarEquipo', async () => {
    serviceMock.retirarEquipo.mockResolvedValue(undefined);

    await controller.retirarEquipo(3, 4);

    expect(serviceMock.retirarEquipo).toHaveBeenCalledWith(3, 4);
  });

  it('delega GET /grupos/:grupoId/tabla-posiciones a obtenerTablaPosiciones', async () => {
    serviceMock.obtenerTablaPosiciones.mockResolvedValue([filaEjemplo]);

    const res = await controller.obtenerTablaPosiciones(3);

    expect(serviceMock.obtenerTablaPosiciones).toHaveBeenCalledWith(3);
    expect(res).toEqual([filaEjemplo]);
  });
});
