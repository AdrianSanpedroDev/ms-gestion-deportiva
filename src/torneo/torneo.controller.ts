import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { CrearTorneoDto } from './dto/crear-torneo.dto';
import { FiltrosTorneoDto } from './dto/filtros-torneo.dto';
import { CambiarEstadoTorneoDto } from './dto/cambiar-estado-torneo.dto';
import { TorneoResponseDto } from './dto/torneo-response.dto';
import { TorneoService } from './torneo.service';

@Controller('torneos')
export class TorneoController {
  constructor(private readonly service: TorneoService) {}
  @Post() crear(@Body() dto: CrearTorneoDto): Promise<TorneoResponseDto> { return this.service.crear(dto); }
  @Get() listar(@Query() filtros: FiltrosTorneoDto): Promise<TorneoResponseDto[]> { return this.service.listar(filtros); }
  @Get(':id') obtener(@Param('id', ParseIntPipe) id: number): Promise<TorneoResponseDto> { return this.service.obtener(id); }
  @Put(':id') actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: CrearTorneoDto) { return this.service.actualizar(id, dto); }
  @Patch(':id/estado') estado(@Param('id', ParseIntPipe) id: number, @Body() dto: CambiarEstadoTorneoDto) { return this.service.cambiarEstado(id, dto); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) eliminar(@Param('id', ParseIntPipe) id: number) { return this.service.eliminar(id); }
}
