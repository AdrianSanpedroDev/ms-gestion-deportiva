import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HabilidadJugador } from '../habilidad-jugador/entities/habilidad-jugador.entity';
import { EquipoJugador } from '../jugador/entities/equipo-jugador.entity';
import { Jugador } from '../jugador/entities/jugador.entity';
import { PerfilController } from './perfil.controller';
import { PerfilService } from './perfil.service';

// Módulo de C (HU-GD-08). A lo importa en app.module.ts (archivo de A).
// Jugador y EquipoJugador (de B) se registran SOLO para lectura (ACUERDOS 7 y 13.3).
@Module({
  imports: [
    TypeOrmModule.forFeature([Jugador, EquipoJugador, HabilidadJugador]),
  ],
  controllers: [PerfilController],
  providers: [PerfilService],
})
export class PerfilModule {}
