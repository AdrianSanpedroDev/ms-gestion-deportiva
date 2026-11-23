import { TipoFase } from '../../fase/entities/tipo-fase.enum';

export class FaseResumenDto {
  id!: number;
  nombre!: string;
  tipo!: TipoFase;
  orden!: number;
}
export { FaseResumenDto as FaseResumen };
