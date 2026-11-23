import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// Entidades AJENAS registradas SOLO para lectura (ACUERDOS 4.1, 7 y 13.3).
import { Partido } from '../partido/entities/partido.entity';
// TODO: Torneo es de A (ACUERDOS 6.8 y 6.14); compila cuando A suba torneo/entities/torneo.entity.ts
import { Torneo } from '../torneo/entities/torneo.entity';
import { Fase, FaseFinal, Grupo } from './entities/fase.entity';
import { GrupoEquipo } from './entities/grupo-equipo.entity';
import { FaseController } from './fase.controller';
import { FaseService } from './fase.service';
import { FaseRepository } from './repositories/fase.repository';

// Módulo de C: fases (HU-GC-03), luego grupos (HU-GC-04) y fase final (HU-GC-05).
// A lo importa en app.module.ts (archivo de A).
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Fase,
      Grupo,
      FaseFinal,
      GrupoEquipo,
      Torneo,
      Partido,
    ]),
  ],
  controllers: [FaseController],
  providers: [FaseService, FaseRepository],
})
export class FaseModule {}
