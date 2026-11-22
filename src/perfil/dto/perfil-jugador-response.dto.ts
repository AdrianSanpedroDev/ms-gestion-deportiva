// TODO: verificar rutas cuando A suba common/dto (ACUERDOS 5.6 y 13.1)
import type { EquipoResumen } from '../../common/dto/equipo-resumen.dto';
import type { HabilidadResumen } from '../../common/dto/habilidad-resumen.dto';
import { TipoDocumento } from '../../jugador/entities/tipo-documento.enum';

// DTOs exclusivos del perfil deportivo (ACUERDOS 9.13: C los define en perfil/dto/, sin reutilizar DTOs de B).
export class JugadorPerfilDto {
  id!: number;
  tipoDocumento!: TipoDocumento;
  numeroDocumento!: string;
  nombreCompleto!: string;
  fechaNacimiento!: string;
  edad!: number;
  email!: string | null;
  telefono!: string | null;
  activo!: boolean;
}

export class EquipoActualPerfilDto {
  equipo!: EquipoResumen;
  fechaInicio!: string;
  fechaFin!: string;
}

export class HistorialEquipoPerfilDto {
  equipo!: EquipoResumen;
  fechaInicio!: string;
  fechaFin!: string;
  fechaRetiro!: string | null;
}

export class PerfilJugadorResponseDto {
  jugador!: JugadorPerfilDto;
  equiposActuales!: EquipoActualPerfilDto[];
  historialEquipos!: HistorialEquipoPerfilDto[];
  habilidades!: HabilidadResumen[];
  tieneEquipos!: boolean;
  tieneHabilidades!: boolean;
  mensajes!: string[];
}
