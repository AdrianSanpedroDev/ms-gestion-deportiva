import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post } from '@nestjs/common';
import { DeporteResumenDto } from '../common/dto/deporte-resumen.dto';
import { EquipoResumenDto } from '../common/dto/equipo-resumen.dto';
import { EquipoDeporteService } from './equipo-deporte.service';

@Controller()
export class EquipoDeporteController {
  constructor(private readonly service: EquipoDeporteService) {}
  @Post('equipos/:equipoId/deportes')
  asociar(@Param('equipoId', ParseIntPipe) equipoId: number, @Body() dto: { deporteId: number }): Promise<DeporteResumenDto> { return this.service.asociar(equipoId, dto.deporteId); }
  @Get('equipos/:equipoId/deportes')
  deportes(@Param('equipoId', ParseIntPipe) equipoId: number): Promise<DeporteResumenDto[]> { return this.service.deportes(equipoId); }
  @Get('deportes/:deporteId/equipos')
  equipos(@Param('deporteId', ParseIntPipe) deporteId: number): Promise<EquipoResumenDto[]> { return this.service.equipos(deporteId); }
  @Delete('equipos/:equipoId/deportes/:deporteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  retirar(@Param('equipoId', ParseIntPipe) equipoId: number, @Param('deporteId', ParseIntPipe) deporteId: number) { return this.service.retirar(equipoId, deporteId); }
}
