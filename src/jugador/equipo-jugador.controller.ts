import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ContratoResponseDto } from './dto/contrato-response.dto';
import { CrearContratoDto } from './dto/crear-contrato.dto';
import { FiltrosContratoDto } from './dto/filtros-contrato.dto';
import { RetiroContratoDto } from './dto/retiro-contrato.dto';
import { EquipoJugadorService } from './equipo-jugador.service';

// HU-GD-05 · ACUERDOS 9.8. Solo recibe HTTP y responde: las reglas están en el service.
// Las rutas empiezan por "equipos" o por "jugadores", así que @Controller() va sin prefijo y cada método
// lleva la ruta completa. La ruta no define al dueño: este controlador es de B (9, "el dueño es el del controlador").
@Controller()
export class EquipoJugadorController {
  constructor(private readonly equipoJugadorService: EquipoJugadorService) {}

  @Post('equipos/:equipoId/jugadores') // 201 por defecto en los POST de Nest
  asignar(
    @Param('equipoId', ParseIntPipe) equipoId: number,
    @Body() dto: CrearContratoDto,
  ): Promise<ContratoResponseDto> {
    return this.equipoJugadorService.asignar(equipoId, dto);
  }

  @Get('equipos/:equipoId/jugadores')
  listarPorEquipo(
    @Param('equipoId', ParseIntPipe) equipoId: number,
    @Query() filtros: FiltrosContratoDto,
  ): Promise<ContratoResponseDto[]> {
    return this.equipoJugadorService.listarPorEquipo(
      equipoId,
      filtros.incluirHistorial,
    );
  }

  @Get('jugadores/:jugadorId/equipos')
  listarPorJugador(
    @Param('jugadorId', ParseIntPipe) jugadorId: number,
    @Query() filtros: FiltrosContratoDto,
  ): Promise<ContratoResponseDto[]> {
    return this.equipoJugadorService.listarPorJugador(
      jugadorId,
      filtros.incluirHistorial,
    );
  }

  // PATCH devuelve 200 + el contrato actualizado (5.1): no es un DELETE, la fila sigue existiendo.
  @Patch('equipos/:equipoId/jugadores/:jugadorId/retiro')
  retirar(
    @Param('equipoId', ParseIntPipe) equipoId: number,
    @Param('jugadorId', ParseIntPipe) jugadorId: number,
    @Body() dto: RetiroContratoDto,
  ): Promise<ContratoResponseDto> {
    return this.equipoJugadorService.retirar(equipoId, jugadorId, dto);
  }
}
