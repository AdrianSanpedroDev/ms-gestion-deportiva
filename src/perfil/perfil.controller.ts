import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PerfilJugadorResponseDto } from './dto/perfil-jugador-response.dto';
import { PerfilService } from './perfil.service';

// HU-GD-08 · ACUERDOS 9.13. Solo recibe HTTP, valida tipos y delega al service.
// El dueño es el del controlador (C); sin guards locales (SecurityGuard es global, ACUERDOS 10.2).
@Controller('jugadores')
export class PerfilController {
  constructor(private readonly perfilService: PerfilService) {}

  @Get(':jugadorId/perfil')
  obtenerPerfil(
    @Param('jugadorId', ParseIntPipe) jugadorId: number,
  ): Promise<PerfilJugadorResponseDto> {
    return this.perfilService.obtenerPerfil(jugadorId);
  }
}
