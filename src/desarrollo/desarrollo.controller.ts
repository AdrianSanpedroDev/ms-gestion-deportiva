import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { DesarrolloService } from './desarrollo.service';
import { DesarrolloTorneoResponseDto } from './dto/desarrollo-torneo-response.dto';

// HU-GC-08 · ACUERDOS 9.17. Solo recibe HTTP, valida tipos y delega al service.
// El dueño es el del controlador (C); sin guards locales (SecurityGuard es global, ACUERDOS 10.2).
@Controller('torneos')
export class DesarrolloController {
  constructor(private readonly desarrolloService: DesarrolloService) {}

  @Get(':torneoId/desarrollo')
  obtenerDesarrollo(
    @Param('torneoId', ParseIntPipe) torneoId: number,
  ): Promise<DesarrolloTorneoResponseDto> {
    return this.desarrolloService.obtenerDesarrollo(torneoId);
  }
}
