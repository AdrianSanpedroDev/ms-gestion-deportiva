import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// Entidades AJENAS registradas SOLO para lectura (ACUERDOS 4.1, 7 y 13.3).
// TODO: Torneo e Inscripcion son de A (ACUERDOS 6.8, 6.10 y 6.14); compilan cuando A suba sus entidades
import { Fase } from '../fase/entities/fase.entity';
import { GrupoEquipo } from '../fase/entities/grupo-equipo.entity';
import { Partido } from '../partido/entities/partido.entity';
import { Inscripcion } from '../torneo/entities/inscripcion.entity';
import { Torneo } from '../torneo/entities/torneo.entity';
import { DesarrolloController } from './desarrollo.controller';
import { DesarrolloService } from './desarrollo.service';

// Módulo de C (HU-GC-08). A lo importa en app.module.ts (archivo de A).
@Module({
  imports: [
    TypeOrmModule.forFeature([Torneo, Inscripcion, Fase, GrupoEquipo, Partido]),
  ],
  controllers: [DesarrolloController],
  providers: [DesarrolloService],
})
export class DesarrolloModule {}
