export class EquipoResponseDto {
  id!: number;
  nombre!: string;
  ciudad!: string;
  fechaFundacion!: string | null;
  descripcion!: string | null;
  activo!: boolean;
  fechaCreacion!: string;
}
