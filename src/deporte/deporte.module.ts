import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipoDeporte } from '../equipo/entities/equipo-deporte.entity';
import { Torneo } from '../torneo/entities/torneo.entity';
import { DeporteController } from './deporte.controller';
import { DeporteService } from './deporte.service';
import { Deporte } from './entities/deporte.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Deporte, EquipoDeporte, Torneo])],
  controllers: [DeporteController],
  providers: [DeporteService],
})
export class DeporteModule {}
