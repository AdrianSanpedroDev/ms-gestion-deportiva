import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { EstadoDto } from '../common/dto/estado.dto';
import { DeporteResponseDto } from './dto/deporte-response.dto';
import { CrearDeporteDto } from './dto/crear-deporte.dto';
import { FiltrosDeporteDto } from './dto/filtros-deporte.dto';
import { DeporteService } from './deporte.service';

@Controller('deportes')
export class DeporteController {
  constructor(private readonly service: DeporteService) {}
  @Post() crear(@Body() dto: CrearDeporteDto): Promise<DeporteResponseDto> { return this.service.crear(dto); }
  @Get() listar(@Query() filtros: FiltrosDeporteDto): Promise<DeporteResponseDto[]> { return this.service.listar(filtros); }
  @Get(':id') obtener(@Param('id', ParseIntPipe) id: number): Promise<DeporteResponseDto> { return this.service.obtener(id); }
  @Get(':id/subdeportes') subdeportes(@Param('id', ParseIntPipe) id: number) { return this.service.subdeportes(id); }
  @Put(':id') actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: CrearDeporteDto) { return this.service.actualizar(id, dto); }
  @Patch(':id/estado') cambiarEstado(@Param('id', ParseIntPipe) id: number, @Body() dto: EstadoDto) { return this.service.cambiarEstado(id, dto); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) eliminar(@Param('id', ParseIntPipe) id: number) { return this.service.eliminar(id); }
}
