import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipo } from '../equipo/entities/equipo.entity';
import { Escenario } from '../escenario/entities/escenario.entity';
import { Inscripcion } from '../torneo/entities/inscripcion.entity';
import { Fase, FaseFinal, Grupo } from '../fase/entities/fase.entity';
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
// Jugador y EquipoJugador (de B, en jugador/), Fase, Grupo, FaseFinal y GrupoEquipo de C, y Equipo, Inscripcion y Escenario de A.
// Fase es abstracta (herencia): sus hijas Grupo y FaseFinal deben registrarse también, porque GrupoEquipo apunta a Grupo.
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
      Grupo,
      FaseFinal,
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
