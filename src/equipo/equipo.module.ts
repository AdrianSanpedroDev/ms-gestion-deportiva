import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deporte } from '../deporte/entities/deporte.entity';
import { EquipoJugador } from '../jugador/entities/equipo-jugador.entity';
import { Inscripcion } from '../torneo/entities/inscripcion.entity';
import { EquipoDeporte } from './entities/equipo-deporte.entity';
import { Equipo } from './entities/equipo.entity';
import { EquipoDeporteController } from './equipo-deporte.controller';
import { EquipoDeporteService } from './equipo-deporte.service';
import { EquipoController } from './equipo.controller';
import { EquipoService } from './equipo.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Equipo,
      EquipoDeporte,
      EquipoJugador,
      Inscripcion,
      Deporte,
    ]),
  ],
  controllers: [EquipoController, EquipoDeporteController],
  providers: [EquipoService, EquipoDeporteService],
})
export class EquipoModule {}
