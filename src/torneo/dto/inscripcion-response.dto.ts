import { EquipoResumenDto } from '../../common/dto/equipo-resumen.dto';
import { TorneoResumen } from '../../common/dto/torneo-resumen.dto';

export class InscripcionResponseDto {
  id!: number;
  torneo!: TorneoResumen;
  equipo!: EquipoResumenDto;
  fechaInscripcion!: string;
}
