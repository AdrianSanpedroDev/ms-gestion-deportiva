import type { Equipo } from '../../equipo/entities/equipo.entity';
import type { Torneo } from '../../torneo/entities/torneo.entity';
import { Grupo } from '../entities/fase.entity';
import { GrupoMapper } from './grupo.mapper';

describe('GrupoMapper', () => {
  it('transforma un Grupo y sus equipos ordenados por nombre a GrupoResponseDto', () => {
    const grupo = new Grupo();
    grupo.id = 3;
    grupo.nombre = 'Grupo A';
    grupo.orden = 1;
    grupo.torneo = {
      id: 1,
      nombre: 'Copa Caldas 2026',
      estado: 'EN_CURSO',
    } as unknown as Torneo;

    const equipos = [
      { id: 9, nombre: 'Once Caldas', activo: true } as Equipo,
      { id: 4, nombre: 'Deportes Pereira', activo: true } as Equipo,
    ];

    expect(GrupoMapper.aResponse(grupo, equipos)).toEqual({
      id: 3,
      torneo: { id: 1, nombre: 'Copa Caldas 2026', estado: 'EN_CURSO' },
      nombre: 'Grupo A',
      orden: 1,
      equipos: [
        { id: 4, nombre: 'Deportes Pereira', activo: true },
        { id: 9, nombre: 'Once Caldas', activo: true },
      ],
    });
  });
});
