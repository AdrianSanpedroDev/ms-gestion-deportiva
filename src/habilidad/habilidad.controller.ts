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
  Put,
  Query,
} from '@nestjs/common';
import { ActualizarHabilidadDto } from './dto/actualizar-habilidad.dto';
import { CrearHabilidadDto } from './dto/crear-habilidad.dto';
import { FiltrosHabilidadDto } from './dto/filtros-habilidad.dto';
import { HabilidadResponseDto } from './dto/habilidad-response.dto';
import { HabilidadService } from './habilidad.service';

// HU-GD-06 · ACUERDOS 9.9 (solo Postman). Solo recibe HTTP y responde: las reglas están en el service.
// El prefijo /api lo pone main.ts (A) → las rutas quedan /api/habilidades...
@Controller('habilidades')
export class HabilidadController {
  constructor(private readonly habilidadService: HabilidadService) {}

  @Post() // 201 por defecto en los POST de Nest
  crear(@Body() dto: CrearHabilidadDto): Promise<HabilidadResponseDto> {
    return this.habilidadService.crear(dto);
  }

  @Get()
  listar(
    @Query() filtros: FiltrosHabilidadDto,
  ): Promise<HabilidadResponseDto[]> {
    return this.habilidadService.listar(filtros);
  }

  @Get(':id')
  obtener(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<HabilidadResponseDto> {
    return this.habilidadService.obtener(id);
  }

  @Put(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarHabilidadDto,
  ): Promise<HabilidadResponseDto> {
    return this.habilidadService.actualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // 204 sin cuerpo (sección 5.1)
  eliminar(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.habilidadService.eliminar(id);
  }
}
