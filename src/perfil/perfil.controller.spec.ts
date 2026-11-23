import { PATH_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { CategoriaHabilidad } from '../habilidad/entities/categoria-habilidad.enum';
import { TipoDocumento } from '../jugador/entities/tipo-documento.enum';
import { PerfilJugadorResponseDto } from './dto/perfil-jugador-response.dto';
import { PerfilController } from './perfil.controller';
import { PerfilService } from './perfil.service';

describe('PerfilController', () => {
  let controller: PerfilController;

  const serviceMock = {
    obtenerPerfil: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const modulo = await Test.createTestingModule({
      controllers: [PerfilController],
      providers: [{ provide: PerfilService, useValue: serviceMock }],
    }).compile();

    controller = modulo.get(PerfilController);
  });

  it('delega obtenerPerfil en el service y devuelve PerfilJugadorResponseDto', async () => {
    const respuesta: PerfilJugadorResponseDto = {
      jugador: {
        id: 7,
        tipoDocumento: TipoDocumento.CC,
        numeroDocumento: '1053000000',
        nombreCompleto: 'Juan Pérez',
        fechaNacimiento: '2002-05-10',
        edad: 24,
        email: 'juan@correo.com',
        telefono: '3001234567',
        activo: true,
      },
      equiposActuales: [
        {
          equipo: { id: 4, nombre: 'Once Caldas', activo: true },
          fechaInicio: '2026-01-01',
          fechaFin: '2027-12-31',
        },
      ],
      historialEquipos: [],
      habilidades: [
        { id: 2, nombre: 'Regate', categoria: CategoriaHabilidad.TECNICA },
      ],
      tieneEquipos: true,
      tieneHabilidades: true,
      mensajes: [],
    };
    serviceMock.obtenerPerfil.mockResolvedValue(respuesta);

    const resultado = await controller.obtenerPerfil(7);

    expect(serviceMock.obtenerPerfil).toHaveBeenCalledWith(7);
    expect(resultado).toEqual(respuesta);
  });

  it('declara la ruta exacta del contrato (ACUERDOS 9.13: GET /api/jugadores/:jugadorId/perfil)', () => {
    expect(Reflect.getMetadata(PATH_METADATA, PerfilController)).toBe(
      'jugadores',
    );
    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        PerfilController.prototype.obtenerPerfil,
      ),
    ).toBe(':jugadorId/perfil');
  });
});
