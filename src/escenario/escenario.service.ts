import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EscenarioResumenDto } from '../common/dto/escenario-resumen.dto';
import { Escenario } from './entities/escenario.entity';
import { EscenarioMapper } from './mappers/escenario.mapper';

@Injectable()
export class EscenarioService {
  constructor(
    @InjectRepository(Escenario)
    private readonly escenarioRepository: Repository<Escenario>,
  ) {}

  async listar(): Promise<EscenarioResumenDto[]> {
    const filas = await this.escenarioRepository.find({
      order: { nombre: 'ASC' },
    });
    return filas.map((fila) => EscenarioMapper.aResumen(fila));
  }
}
