import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fase, FaseFinal, Grupo } from '../fase/entities/fase.entity';
import { GrupoEquipo } from '../fase/entities/grupo-equipo.entity';
import { Partido } from '../partido/entities/partido.entity';
import { Inscripcion } from '../torneo/entities/inscripcion.entity';
import { Torneo } from '../torneo/entities/torneo.entity';
import { DesarrolloController } from './desarrollo.controller';
import { DesarrolloService } from './desarrollo.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Torneo,
      Inscripcion,
      Fase,
      Grupo,
      FaseFinal,
      GrupoEquipo,
      Partido,
    ]),
  ],
  controllers: [DesarrolloController],
  providers: [DesarrolloService],
})
export class DesarrolloModule {}
