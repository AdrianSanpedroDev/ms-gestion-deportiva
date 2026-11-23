import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CrearInscripcionesDto } from './dto/crear-inscripciones.dto';
import { InscripcionResponseDto } from './dto/inscripcion-response.dto';
import { InscripcionService } from './inscripcion.service';

@Controller()
export class InscripcionController {
  constructor(private readonly service: InscripcionService) {}
  @Post('torneos/:torneoId/inscripciones')
  inscribir(@Param('torneoId', ParseIntPipe) torneoId: number, @Body() dto: CrearInscripcionesDto): Promise<InscripcionResponseDto[]> { return this.service.inscribir(torneoId, dto); }
  @Get('torneos/:torneoId/inscripciones')
  listarTorneo(@Param('torneoId', ParseIntPipe) torneoId: number): Promise<InscripcionResponseDto[]> { return this.service.listarTorneo(torneoId); }
  @Get('equipos/:equipoId/torneos')
  listarEquipo(@Param('equipoId', ParseIntPipe) equipoId: number): Promise<InscripcionResponseDto[]> { return this.service.listarEquipo(equipoId); }
  @Delete('torneos/:torneoId/inscripciones/:equipoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  retirar(@Param('torneoId', ParseIntPipe) torneoId: number, @Param('equipoId', ParseIntPipe) equipoId: number) { return this.service.retirar(torneoId, equipoId); }
}
