import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import type { JugadorResumen } from '../common/dto/jugador-resumen.dto';
import { AsignarHabilidadDto } from './dto/asignar-habilidad.dto';
import type { HabilidadResumen } from './dto/habilidad-resumen.dto';
import { HabilidadJugadorService } from './habilidad-jugador.service';

// HU-GD-07 · ACUERDOS 9.12. Solo recibe HTTP, valida tipos y delega al service.
// Rutas bajo "jugadores" y "habilidades" → @Controller() sin prefijo; el dueño es el del controlador (C).
@Controller()
export class HabilidadJugadorController {
  constructor(
    private readonly habilidadJugadorService: HabilidadJugadorService,
  ) {}

  @Post('jugadores/:jugadorId/habilidades')
  asignar(
    @Param('jugadorId', ParseIntPipe) jugadorId: number,
    @Body() dto: AsignarHabilidadDto,
  ): Promise<HabilidadResumen> {
    return this.habilidadJugadorService.asignar(jugadorId, dto);
  }

  @Get('jugadores/:jugadorId/habilidades')
  listarHabilidadesPorJugador(
    @Param('jugadorId', ParseIntPipe) jugadorId: number,
  ): Promise<HabilidadResumen[]> {
    return this.habilidadJugadorService.listarHabilidadesPorJugador(jugadorId);
  }

  @Get('habilidades/:habilidadId/jugadores')
  listarJugadoresPorHabilidad(
    @Param('habilidadId', ParseIntPipe) habilidadId: number,
  ): Promise<JugadorResumen[]> {
    return this.habilidadJugadorService.listarJugadoresPorHabilidad(
      habilidadId,
    );
  }

  @Delete('jugadores/:jugadorId/habilidades/:habilidadId')
  @HttpCode(HttpStatus.NO_CONTENT)
  retirar(
    @Param('jugadorId', ParseIntPipe) jugadorId: number,
    @Param('habilidadId', ParseIntPipe) habilidadId: number,
  ): Promise<void> {
    return this.habilidadJugadorService.retirar(jugadorId, habilidadId);
  }
}
