import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// TODO: HabilidadJugador es de C; compila cuando C suba habilidad-jugador/entities/habilidad-jugador.entity.ts
import { HabilidadJugador } from '../habilidad-jugador/entities/habilidad-jugador.entity';
import { Habilidad } from './entities/habilidad.entity';
import { HabilidadController } from './habilidad.controller';
import { HabilidadService } from './habilidad.service';

// Módulo de B. A lo importa en app.module.ts (archivo de A).
// HabilidadJugador (de C) se registra SOLO para leer: contar asignaciones antes de eliminar una habilidad.
// Así se inyecta Repository<HabilidadJugador> sin importar el módulo de C ni su Service.
@Module({
  imports: [TypeOrmModule.forFeature([Habilidad, HabilidadJugador])],
  controllers: [HabilidadController],
  providers: [HabilidadService],
})
export class HabilidadModule {}
