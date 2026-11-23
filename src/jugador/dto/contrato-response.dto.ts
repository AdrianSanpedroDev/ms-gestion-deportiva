// "import type": solo se usan como TIPOS. Al compilar a JavaScript esta línea desaparece (no se carga ningún archivo).
import type { EquipoResumen } from '../../common/dto/equipo-resumen.dto';
import type { JugadorResumen } from '../../common/dto/jugador-resumen.dto';

// ContratoResponse (9.8). Los resúmenes evitan devolver las entidades Equipo y Jugador completas.
export class ContratoResponseDto {
  id!: number;
  jugador!: JugadorResumen;
  equipo!: EquipoResumen;
  fechaInicio!: string;
  fechaFin!: string;
  fechaRetiro!: string | null;
  activo!: boolean;
}
