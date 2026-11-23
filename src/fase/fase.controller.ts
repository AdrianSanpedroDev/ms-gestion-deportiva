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
} from '@nestjs/common';
import { ActualizarFaseDto } from './dto/actualizar-fase.dto';
import { FaseResponseDto } from './dto/fase-response.dto';
import { FaseService } from './fase.service';

// HU-GC-03 · ACUERDOS 9.14. Solo recibe HTTP, valida tipos y delega a FaseService.
// Rutas bajo "torneos" y "fases" → @Controller() sin prefijo; sin guards locales (SecurityGuard global).
@Controller()
export class FaseController {
  constructor(private readonly faseService: FaseService) {}

  @Get('torneos/:torneoId/fases')
  listarPorTorneo(
    @Param('torneoId', ParseIntPipe) torneoId: number,
  ): Promise<FaseResponseDto[]> {
    return this.faseService.listarPorTorneo(torneoId);
  }

  @Get('fases/:id')
  obtener(@Param('id', ParseIntPipe) id: number): Promise<FaseResponseDto> {
    return this.faseService.obtener(id);
  }

  @Patch('fases/:id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarFaseDto,
  ): Promise<FaseResponseDto> {
    return this.faseService.actualizar(id, dto);
  }

  @Delete('fases/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.faseService.eliminar(id);
  }
}
