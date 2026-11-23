import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipoJugador } from '../jugador/entities/equipo-jugador.entity';
import { Inscripcion } from '../torneo/entities/inscripcion.entity';
import { Torneo } from '../torneo/entities/torneo.entity';
import { Deporte } from '../deporte/entities/deporte.entity';
import { EquipoController } from './equipo.controller';
import { EquipoService } from './equipo.service';
import { EquipoDeporteController } from './equipo-deporte.controller';
import { EquipoDeporteService } from './equipo-deporte.service';
import { EquipoDeporte } from './entities/equipo-deporte.entity';
import { Equipo } from './entities/equipo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Equipo, EquipoDeporte, EquipoJugador, Inscripcion, Torneo, Deporte])],
  controllers: [EquipoController, EquipoDeporteController],
  providers: [EquipoService, EquipoDeporteService],
  exports: [EquipoService],
})
export class EquipoModule {}
