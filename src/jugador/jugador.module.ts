import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Jugador } from './entities/jugador.entity';
import { JugadorController } from './jugador.controller';
import { JugadorService } from './jugador.service';

// Módulo de B. A lo importa en app.module.ts (archivo de A).
// Cuando existan, se agregan aquí: EquipoJugador (GD-05) y, solo para leer, HabilidadJugador (C) y Anotacion (GC-07).
@Module({
  imports: [TypeOrmModule.forFeature([Jugador])],
  controllers: [JugadorController],
  providers: [JugadorService],
})
export class JugadorModule {}
