import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EscenarioController } from './escenario.controller';
import { Escenario } from './entities/escenario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Escenario])],
  controllers: [EscenarioController],
})
export class EscenarioModule {}
