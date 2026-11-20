import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
// TODO: ajustar la ruta cuando A suba common/dto
import { EstadoDto } from '../common/dto/estado.dto';
import { ActualizarJugadorDto } from './dto/actualizar-jugador.dto';
import { CrearJugadorDto } from './dto/crear-jugador.dto';
import { FiltrosJugadorDto } from './dto/filtros-jugador.dto';
import { JugadorResponseDto } from './dto/jugador-response.dto';
import { JugadorService } from './jugador.service';

// HU-GD-04 · ACUERDOS 9.7. Solo recibe HTTP y responde: las reglas están en el service.
// El prefijo /api lo pone main.ts (A) → las rutas quedan /api/jugadores...
@Controller('jugadores')
export class JugadorController {
  constructor(private readonly jugadorService: JugadorService) {}

  @Post() // 201 por defecto en los POST de Nest
  crear(@Body() dto: CrearJugadorDto): Promise<JugadorResponseDto> {
    return this.jugadorService.crear(dto);
  }

  @Get()
  listar(@Query() filtros: FiltrosJugadorDto): Promise<JugadorResponseDto[]> {
    return this.jugadorService.listar(filtros);
  }

  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number): Promise<JugadorResponseDto> {
    return this.jugadorService.obtener(id);
  }

  @Put(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarJugadorDto,
  ): Promise<JugadorResponseDto> {
    return this.jugadorService.actualizar(id, dto);
  }

  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EstadoDto,
  ): Promise<JugadorResponseDto> {
    return this.jugadorService.cambiarEstado(id, dto.activo);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // 204 sin cuerpo (sección 5.1)
  eliminar(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.jugadorService.eliminar(id);
  }
}
