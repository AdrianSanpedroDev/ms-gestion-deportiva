import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EscenarioResumenDto } from '../common/dto/escenario-resumen.dto';
import { Escenario } from './entities/escenario.entity';

@Controller('escenarios')
export class EscenarioController {
  constructor(@InjectRepository(Escenario) private readonly escenarios: Repository<Escenario>) {}
  @Get()
  async listar(): Promise<EscenarioResumenDto[]> {
    const filas = await this.escenarios.find({ order: { nombre: 'ASC' } });
    return filas.map((fila) => ({ id: fila.id, nombre: fila.nombre, direccion: fila.direccion }));
  }
}
