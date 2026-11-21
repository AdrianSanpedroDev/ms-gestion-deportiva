import { Body, Controller, Param, ParseIntPipe, Put } from '@nestjs/common';
import { PartidoResponseDto } from './dto/partido-response.dto';
import { ResultadoDto } from './dto/resultado.dto';
import { PartidoService } from './partido.service';

// HU-GC-07 · ACUERDOS 9.11. Solo recibe HTTP y responde: las reglas están en PartidoService
// (el resultado son columnas de partido). Controlador aparte porque 9.11 lo nombra ResultadoController.
@Controller()
export class ResultadoController {
  constructor(private readonly partidoService: PartidoService) {}

  // PUT = registrar O modificar el marcador (200 + PartidoResponse).
  @Put('partidos/:id/resultado')
  registrar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResultadoDto,
  ): Promise<PartidoResponseDto> {
    return this.partidoService.registrarResultado(id, dto);
  }
}
