import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// Entidades AJENAS registradas SOLO para lectura (ACUERDOS 4.1, 7 y 13.3).
// TODO: Equipo, Torneo e Inscripcion son de A (ACUERDOS 6.2, 6.8, 6.10 y 6.14); compilan cuando A suba sus entidades
import { Equipo } from '../equipo/entities/equipo.entity';
import { Partido } from '../partido/entities/partido.entity';
import { Inscripcion } from '../torneo/entities/inscripcion.entity';
import { Torneo } from '../torneo/entities/torneo.entity';
import { Fase, FaseFinal, Grupo } from './entities/fase.entity';
import { GrupoEquipo } from './entities/grupo-equipo.entity';
import { FaseController } from './fase.controller';
import { FaseService } from './fase.service';
import { GrupoController } from './grupo.controller';
import { GrupoService } from './grupo.service';
import { FaseRepository } from './repositories/fase.repository';

// Módulo de C: fases (HU-GC-03), grupos (HU-GC-04) y luego fase final (HU-GC-05).
// A lo importa en app.module.ts (archivo de A).
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Fase,
      Grupo,
      FaseFinal,
      GrupoEquipo,
      Torneo,
      Equipo,
      Inscripcion,
      Partido,
    ]),
  ],
  controllers: [FaseController, GrupoController],
  providers: [FaseService, GrupoService, FaseRepository],
})
export class FaseModule {}
