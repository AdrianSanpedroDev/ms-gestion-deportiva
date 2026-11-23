import type { Equipo } from '../../equipo/entities/equipo.entity';
import { EstadoPartido } from '../../partido/entities/estado-partido.enum';
import type { Partido } from '../../partido/entities/partido.entity';
import { FaseFinal } from '../entities/fase.entity';
import { RondaFinal } from '../entities/ronda-final.enum';
import { TipoFase } from '../entities/tipo-fase.enum';
import { FaseFinalMapper } from './fase-final.mapper';

describe('FaseFinalMapper', () => {
  it('mapea un Partido al contrato exacto PartidoResumen', () => {
    const partido = {
      id: 20,
      equipoLocal: { id: 4, nombre: 'Once Caldas', activo: true } as Equipo,
      equipoVisitante: {
        id: 9,
        nombre: 'Deportes Pereira',
        activo: true,
      } as Equipo,
      fechaHora: new Date(2026, 11, 5, 15, 30, 0),
      estado: EstadoPartido.FINALIZADO,
      marcadorLocal: 2,
      marcadorVisitante: 1,
      ronda: RondaFinal.SEMIFINAL,
      numeroLlave: 1,
    } as Partido;

    expect(FaseFinalMapper.aPartidoResumen(partido)).toEqual({
      id: 20,
      equipoLocal: { id: 4, nombre: 'Once Caldas', activo: true },
      equipoVisitante: { id: 9, nombre: 'Deportes Pereira', activo: true },
      fechaHora: '2026-12-05T15:30:00',
      estado: EstadoPartido.FINALIZADO,
      marcadorLocal: 2,
      marcadorVisitante: 1,
      tieneResultado: true,
      ronda: RondaFinal.SEMIFINAL,
      numeroLlave: 1,
    });
  });

  it('mapea FaseFinal y rondas a LlavesResponseDto', () => {
    const faseFinal = new FaseFinal();
    faseFinal.id = 8;
    faseFinal.nombre = 'Fase final';
    faseFinal.orden = 2;
    faseFinal.cantidadEquipos = 4;
    faseFinal.tercerPuesto = true;

    const rondas = [
      {
        ronda: RondaFinal.FINAL,
        llaves: [{ numeroLlave: 1, partido: null, ganador: null }],
      },
    ];

    expect(FaseFinalMapper.aLlavesResponse(faseFinal, rondas)).toEqual({
      fase: { id: 8, nombre: 'Fase final', tipo: TipoFase.FINAL, orden: 2 },
      cantidadEquipos: 4,
      tercerPuesto: true,
      rondas,
    });
  });
});
