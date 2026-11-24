import { EscenarioResumenDto } from '../../common/dto/escenario-resumen.dto';
import { Escenario } from '../entities/escenario.entity';

export class EscenarioMapper {
  static aResumen(escenario: Escenario): EscenarioResumenDto {
    return {
      id: escenario.id,
      nombre: escenario.nombre,
    };
  }
}
