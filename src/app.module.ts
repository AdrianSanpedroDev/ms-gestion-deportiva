import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityGuard } from './common/guards/security.guard';
import { NotificacionModule } from './common/notificacion/notificacion.module';
import { DeporteModule } from './deporte/deporte.module';
import { DesarrolloModule } from './desarrollo/desarrollo.module';
import { EquipoModule } from './equipo/equipo.module';
import { EscenarioModule } from './escenario/escenario.module';
import { FaseModule } from './fase/fase.module';
import { HabilidadJugadorModule } from './habilidad-jugador/habilidad-jugador.module';
import { HabilidadModule } from './habilidad/habilidad.module';
import { JugadorModule } from './jugador/jugador.module';
import { PartidoModule } from './partido/partido.module';
import { PerfilModule } from './perfil/perfil.module';
import { TorneoModule } from './torneo/torneo.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '3306')),
        username: config.get<string>('DB_USERNAME', 'root'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_DATABASE', 'gestion_deportiva_db'),
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
        dateStrings: true,
        timezone: '-05:00',
      }),
    }),
    NotificacionModule,
    DeporteModule,
    EquipoModule,
    EscenarioModule,
    TorneoModule,
    JugadorModule,
    HabilidadModule,
    PartidoModule,
    HabilidadJugadorModule,
    PerfilModule,
    FaseModule,
    DesarrolloModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SecurityGuard,
    },
  ],
})
export class AppModule {}
