import { Controller, Get } from '@nestjs/common';
import { EscenarioResumenDto } from '../common/dto/escenario-resumen.dto';
import { EscenarioService } from './escenario.service';

@Controller('escenarios')
export class EscenarioController {
  constructor(private readonly escenarioService: EscenarioService) {}

  @Get()
  listar(): Promise<EscenarioResumenDto[]> {
    return this.escenarioService.listar();
  }
}
