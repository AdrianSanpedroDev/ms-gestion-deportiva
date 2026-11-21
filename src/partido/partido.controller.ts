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
import { ActualizarPartidoDto } from './dto/actualizar-partido.dto';
import { CambiarEstadoPartidoDto } from './dto/cambiar-estado-partido.dto';
import { CrearPartidoDto } from './dto/crear-partido.dto';
import { FiltrosPartidoFaseDto } from './dto/filtros-partido-fase.dto';
import { FiltrosPartidoDto } from './dto/filtros-partido.dto';
import { PartidoResponseDto } from './dto/partido-response.dto';
import { PartidoService } from './partido.service';

// HU-GC-06 · ACUERDOS 9.10. Solo recibe HTTP y responde: las reglas están en el service.
// Unas rutas empiezan por "fases" y otras por "partidos": @Controller() va sin prefijo y cada método
// lleva la ruta completa (como EquipoJugadorController). El prefijo /api lo pone main.ts (A).
@Controller()
export class PartidoController {
  constructor(private readonly partidoService: PartidoService) {}

  @Post('fases/:faseId/partidos') // 201 por defecto en los POST de Nest
  crear(
    @Param('faseId', ParseIntPipe) faseId: number,
    @Body() dto: CrearPartidoDto,
  ): Promise<PartidoResponseDto> {
    return this.partidoService.crear(faseId, dto);
  }

  @Get('fases/:faseId/partidos')
  listarPorFase(
    @Param('faseId', ParseIntPipe) faseId: number,
    @Query() filtros: FiltrosPartidoFaseDto,
  ): Promise<PartidoResponseDto[]> {
    return this.partidoService.listarPorFase(faseId, filtros);
  }

  @Get('partidos')
  listar(@Query() filtros: FiltrosPartidoDto): Promise<PartidoResponseDto[]> {
    return this.partidoService.listar(filtros);
  }

  @Get('partidos/:id')
  obtener(@Param('id', ParseIntPipe) id: number): Promise<PartidoResponseDto> {
    return this.partidoService.obtener(id);
  }

  @Put('partidos/:id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarPartidoDto,
  ): Promise<PartidoResponseDto> {
    return this.partidoService.actualizar(id, dto);
  }

  @Patch('partidos/:id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoPartidoDto,
  ): Promise<PartidoResponseDto> {
    return this.partidoService.cambiarEstado(id, dto.estado);
  }

  @Delete('partidos/:id')
  @HttpCode(HttpStatus.NO_CONTENT) // 204 sin cuerpo (sección 5.1)
  eliminar(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.partidoService.eliminar(id);
  }
}
