import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Habilidad } from '../habilidad/entities/habilidad.entity';
import { Jugador } from '../jugador/entities/jugador.entity';
import { HabilidadJugador } from './entities/habilidad-jugador.entity';
import { HabilidadJugadorController } from './habilidad-jugador.controller';
import { HabilidadJugadorService } from './habilidad-jugador.service';

// Módulo de C (HU-GD-07). A lo importa en app.module.ts (archivo de A).
// Jugador y Habilidad (de B) se registran SOLO para lectura (ACUERDOS 7).
@Module({
  imports: [TypeOrmModule.forFeature([HabilidadJugador, Jugador, Habilidad])],
  controllers: [HabilidadJugadorController],
  providers: [HabilidadJugadorService],
})
export class HabilidadJugadorModule {}
