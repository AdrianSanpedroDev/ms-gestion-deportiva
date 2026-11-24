import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deporte } from '../deporte/entities/deporte.entity';
import { EquipoDeporte } from '../equipo/entities/equipo-deporte.entity';
import { Equipo } from '../equipo/entities/equipo.entity';
import { Fase, FaseFinal, Grupo } from '../fase/entities/fase.entity';
import { GrupoEquipo } from '../fase/entities/grupo-equipo.entity';
import { Partido } from '../partido/entities/partido.entity';
import { Inscripcion } from './entities/inscripcion.entity';
import { Torneo } from './entities/torneo.entity';
import { InscripcionController } from './inscripcion.controller';
import { InscripcionService } from './inscripcion.service';
import { TorneoController } from './torneo.controller';
import { TorneoService } from './torneo.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Torneo,
      Inscripcion,
      Deporte,
      Equipo,
      EquipoDeporte,
      Fase,
      Grupo,
      FaseFinal,
      GrupoEquipo,
      Partido,
    ]),
  ],
  controllers: [TorneoController, InscripcionController],
  providers: [TorneoService, InscripcionService],
})
export class TorneoModule {}
