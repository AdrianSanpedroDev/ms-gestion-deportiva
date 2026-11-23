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
// TODO: verificar ruta cuando A suba common/dto/equipo-resumen.dto.ts (ACUERDOS 5.6 y 13.1)
import type { EquipoResumen } from '../common/dto/equipo-resumen.dto';
import { ActualizarGrupoDto } from './dto/actualizar-grupo.dto';
import { AsignarEquiposGrupoDto } from './dto/asignar-equipos-grupo.dto';
import { CrearGrupoDto } from './dto/crear-grupo.dto';
import { FilaPosicionDto } from './dto/fila-posicion.dto';
import { FiltrosGrupoDto } from './dto/filtros-grupo.dto';
import { GrupoResponseDto } from './dto/grupo-response.dto';
import { GrupoService } from './grupo.service';

// HU-GC-04 · ACUERDOS 9.15. Solo recibe HTTP, valida tipos y delega a GrupoService.
// Rutas bajo "torneos" y "grupos" → @Controller() sin prefijo; sin guards locales (SecurityGuard global).
@Controller()
export class GrupoController {
  constructor(private readonly grupoService: GrupoService) {}

  @Post('torneos/:torneoId/grupos')
  @HttpCode(HttpStatus.CREATED)
  crear(
    @Param('torneoId', ParseIntPipe) torneoId: number,
    @Body() dto: CrearGrupoDto,
  ): Promise<GrupoResponseDto> {
    return this.grupoService.crear(torneoId, dto);
  }

  @Get('torneos/:torneoId/grupos')
  listarPorTorneo(
    @Param('torneoId', ParseIntPipe) torneoId: number,
    @Query() filtros: FiltrosGrupoDto,
  ): Promise<GrupoResponseDto[]> {
    return this.grupoService.listarPorTorneo(torneoId, filtros);
  }

  @Get('grupos/:id')
  obtener(@Param('id', ParseIntPipe) id: number): Promise<GrupoResponseDto> {
    return this.grupoService.obtener(id);
  }

  @Put('grupos/:id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarGrupoDto,
  ): Promise<GrupoResponseDto> {
    return this.grupoService.actualizar(id, dto);
  }

  @Delete('grupos/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.grupoService.eliminar(id);
  }

  @Post('grupos/:grupoId/equipos')
  @HttpCode(HttpStatus.CREATED)
  asignarEquipos(
    @Param('grupoId', ParseIntPipe) grupoId: number,
    @Body() dto: AsignarEquiposGrupoDto,
  ): Promise<EquipoResumen[]> {
    return this.grupoService.asignarEquipos(grupoId, dto);
  }

  @Get('grupos/:grupoId/equipos')
  listarEquipos(
    @Param('grupoId', ParseIntPipe) grupoId: number,
  ): Promise<EquipoResumen[]> {
    return this.grupoService.listarEquipos(grupoId);
  }

  @Delete('grupos/:grupoId/equipos/:equipoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  retirarEquipo(
    @Param('grupoId', ParseIntPipe) grupoId: number,
    @Param('equipoId', ParseIntPipe) equipoId: number,
  ): Promise<void> {
    return this.grupoService.retirarEquipo(grupoId, equipoId);
  }

  @Get('grupos/:grupoId/tabla-posiciones')
  obtenerTablaPosiciones(
    @Param('grupoId', ParseIntPipe) grupoId: number,
  ): Promise<FilaPosicionDto[]> {
    return this.grupoService.obtenerTablaPosiciones(grupoId);
  }
}
