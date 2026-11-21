import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// TODO: Equipo y Escenario son de A (equipo/ y escenario/), Inscripcion también (torneo/); compilan cuando A los suba
import { Equipo } from '../equipo/entities/equipo.entity';
import { Escenario } from '../escenario/entities/escenario.entity';
import { Inscripcion } from '../torneo/entities/inscripcion.entity';
// TODO: Fase y GrupoEquipo son de C (fase/); compilan cuando C los suba
import { Fase } from '../fase/entities/fase.entity';
import { GrupoEquipo } from '../fase/entities/grupo-equipo.entity';
// Jugador y EquipoJugador son de B (jugador/): las anotaciones los LEEN (quién anotó y con qué equipo).
import { EquipoJugador } from '../jugador/entities/equipo-jugador.entity';
import { Jugador } from '../jugador/entities/jugador.entity';
import { AnotacionController } from './anotacion.controller';
import { AnotacionService } from './anotacion.service';
import { Anotacion } from './entities/anotacion.entity';
import { Partido } from './entities/partido.entity';
import { PartidoController } from './partido.controller';
import { PartidoService } from './partido.service';
import { PartidoRepository } from './repositories/partido.repository';
import { ResultadoController } from './resultado.controller';

// Módulo de B: partidos (GC-06) y resultados y anotaciones (GC-07). A lo importa en app.module.ts.
// forFeature registra las entidades PROPIAS (Partido, Anotacion) y las que solo se leen:
// Jugador y EquipoJugador (de B, en jugador/), Fase y GrupoEquipo de C, y Equipo, Inscripcion y Escenario de A.
// Así se inyecta Repository<T> sin importar otros módulos ni sus Services (sin dependencias circulares, 4.1 y 7).
// CorreoService y DestinatariosService NO se registran aquí: vienen del NotificacionModule @Global (A).
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Partido,
      Anotacion,
      Jugador,
      EquipoJugador,
      Fase,
      GrupoEquipo,
      Equipo,
      Inscripcion,
      Escenario,
    ]),
  ],
  controllers: [PartidoController, ResultadoController, AnotacionController],
  // PartidoRepository es nuestro repositorio con SQL propio: es un provider más, como los services.
  providers: [PartidoService, AnotacionService, PartidoRepository],
})
export class PartidoModule {}
