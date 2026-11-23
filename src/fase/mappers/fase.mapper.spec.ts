import type { Torneo } from '../../torneo/entities/torneo.entity';
import { FaseFinal, Grupo } from '../entities/fase.entity';
import { TipoFase } from '../entities/tipo-fase.enum';
import { FaseMapper } from './fase.mapper';

const torneoMock = (): Torneo =>
  ({
    id: 1,
    nombre: 'Copa Caldas 2026',
    estado: 'EN_CURSO',
  }) as Torneo;

const crearGrupo = (): Grupo => {
  const grupo = new Grupo();
  grupo.id = 3;
  grupo.torneo = torneoMock();
  grupo.nombre = 'Grupo A';
  grupo.orden = 1;
  return grupo;
};

const crearFaseFinal = (): FaseFinal => {
  const faseFinal = new FaseFinal();
  faseFinal.id = 8;
  faseFinal.torneo = torneoMock();
  faseFinal.nombre = 'Fase final';
  faseFinal.orden = 2;
  faseFinal.cantidadEquipos = 4;
  faseFinal.tercerPuesto = true;
  return faseFinal;
};

describe('FaseMapper', () => {
  it('identifica tipoDeFase correctamente para Grupo y FaseFinal', () => {
    expect(FaseMapper.tipoDeFase(crearGrupo())).toBe(TipoFase.GRUPO);
    expect(FaseMapper.tipoDeFase(crearFaseFinal())).toBe(TipoFase.FINAL);
  });

  it('construye FaseResumen con id, nombre, tipo y orden', () => {
    expect(FaseMapper.aResumen(crearGrupo())).toEqual({
      id: 3,
      nombre: 'Grupo A',
      tipo: TipoFase.GRUPO,
      orden: 1,
    });
  });

  it('mapea un Grupo a FaseResponseDto con conteo numérico de equipos y tercerPuesto en null', () => {
    const response = FaseMapper.aResponse(crearGrupo(), 6, 4);

    expect(response).toEqual({
      id: 3,
      torneo: {
        id: 1,
        nombre: 'Copa Caldas 2026',
        estado: 'EN_CURSO',
      },
      nombre: 'Grupo A',
      tipo: TipoFase.GRUPO,
      orden: 1,
      cantidadEquipos: 4,
      tercerPuesto: null,
      cantidadPartidos: 6,
    });
  });

  it('mapea una FaseFinal a FaseResponseDto con cantidadEquipos y tercerPuesto propios', () => {
    const response = FaseMapper.aResponse(crearFaseFinal(), 2);

    expect(response).toEqual({
      id: 8,
      torneo: {
        id: 1,
        nombre: 'Copa Caldas 2026',
        estado: 'EN_CURSO',
      },
      nombre: 'Fase final',
      tipo: TipoFase.FINAL,
      orden: 2,
      cantidadEquipos: 4,
      tercerPuesto: true,
      cantidadPartidos: 2,
    });
  });
});
