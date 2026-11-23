import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipo } from '../equipo/entities/equipo.entity';
import { HabilidadJugador } from '../habilidad-jugador/entities/habilidad-jugador.entity';
import { Anotacion } from '../partido/entities/anotacion.entity';
import { EquipoJugador } from './entities/equipo-jugador.entity';
import { Jugador } from './entities/jugador.entity';
import { EquipoJugadorController } from './equipo-jugador.controller';
import { EquipoJugadorService } from './equipo-jugador.service';
import { JugadorController } from './jugador.controller';
import { JugadorService } from './jugador.service';

// Módulo de B: jugadores (GD-04) y contratos equipo ↔ jugador (GD-05). A lo importa en app.module.ts (archivo de A).
// Equipo es de A y aquí SOLO se lee: registrarlo en forFeature permite inyectar Repository<Equipo>
// sin importar el módulo de A ni su EquipoService (así no hay dependencias circulares, ACUERDOS 4.1 y 7).
// También solo para leer (contar al eliminar un jugador): HabilidadJugador (de C) y Anotacion (de B, partido/).
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Jugador,
      EquipoJugador,
      Equipo,
      HabilidadJugador,
      Anotacion,
    ]),
  ],
  controllers: [JugadorController, EquipoJugadorController],
  providers: [JugadorService, EquipoJugadorService],
})
export class JugadorModule {}
