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
} from '@nestjs/common';
import { ActualizarFaseFinalDto } from './dto/actualizar-fase-final.dto';
import { CrearFaseFinalDto } from './dto/crear-fase-final.dto';
import { FaseResponseDto } from './dto/fase-response.dto';
import { LlavesResponseDto } from './dto/llaves-response.dto';
import { FaseFinalService } from './fase-final.service';

// HU-GC-05 · ACUERDOS 9.16. Solo recibe HTTP, valida tipos y delega a FaseFinalService.
// Rutas bajo "torneos" y "fases-finales" → @Controller() sin prefijo; sin guards locales (SecurityGuard global).
@Controller()
export class FaseFinalController {
  constructor(private readonly faseFinalService: FaseFinalService) {}

  @Post('torneos/:torneoId/fase-final')
  @HttpCode(HttpStatus.CREATED)
  crear(
    @Param('torneoId', ParseIntPipe) torneoId: number,
    @Body() dto: CrearFaseFinalDto,
  ): Promise<FaseResponseDto> {
    return this.faseFinalService.crear(torneoId, dto);
  }

  @Get('torneos/:torneoId/fase-final')
  obtenerPorTorneo(
    @Param('torneoId', ParseIntPipe) torneoId: number,
  ): Promise<FaseResponseDto> {
    return this.faseFinalService.obtenerPorTorneo(torneoId);
  }

  @Put('fases-finales/:id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarFaseFinalDto,
  ): Promise<FaseResponseDto> {
    return this.faseFinalService.actualizar(id, dto);
  }

  @Delete('fases-finales/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.faseFinalService.eliminar(id);
  }

  @Get('fases-finales/:id/llaves')
  obtenerLlaves(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LlavesResponseDto> {
    return this.faseFinalService.obtenerLlaves(id);
  }
}
