import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { EstadoDto } from '../common/dto/estado.dto';
import { CrearEquipoDto } from './dto/crear-equipo.dto';
import { FiltrosEquipoDto } from './dto/filtros-equipo.dto';
import { EquipoResponseDto } from './dto/equipo-response.dto';
import { EquipoService } from './equipo.service';

@Controller('equipos')
export class EquipoController {
  constructor(private readonly service: EquipoService) {}
  @Post() crear(@Body() dto: CrearEquipoDto): Promise<EquipoResponseDto> { return this.service.crear(dto); }
  @Get() listar(@Query() filtros: FiltrosEquipoDto): Promise<EquipoResponseDto[]> { return this.service.listar(filtros); }
  @Get(':id') obtener(@Param('id', ParseIntPipe) id: number): Promise<EquipoResponseDto> { return this.service.obtener(id); }
  @Put(':id') actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: CrearEquipoDto) { return this.service.actualizar(id, dto); }
  @Patch(':id/estado') estado(@Param('id', ParseIntPipe) id: number, @Body() dto: EstadoDto) { return this.service.cambiarEstado(id, dto); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) eliminar(@Param('id', ParseIntPipe) id: number) { return this.service.eliminar(id); }
}
