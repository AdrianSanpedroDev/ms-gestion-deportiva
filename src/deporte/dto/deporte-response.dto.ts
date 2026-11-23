import { DeporteResumenDto } from '../../common/dto/deporte-resumen.dto';

export class DeporteResponseDto {
  id!: number;
  nombre!: string;
  descripcion!: string | null;
  activo!: boolean;
  deportePadre!: DeporteResumenDto | null;
  subdeportes!: DeporteResumenDto[];
  fechaCreacion!: string;
}
