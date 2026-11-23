import { EquipoResumenDto } from '../../common/dto/equipo-resumen.dto';
import { EstadoTorneo } from '../entities/estado-torneo.enum';

export class InscripcionResponseDto {
  id!: number;
  torneo!: { id: number; nombre: string; estado: EstadoTorneo };
  equipo!: EquipoResumenDto;
  fechaInscripcion!: string;
}
