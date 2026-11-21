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
import { AnotacionService } from './anotacion.service';
import { ActualizarAnotacionDto } from './dto/actualizar-anotacion.dto';
import { AnotacionResponseDto } from './dto/anotacion-response.dto';
import { CrearAnotacionDto } from './dto/crear-anotacion.dto';

// HU-GC-07 · ACUERDOS 9.11. Solo recibe HTTP y responde: las reglas están en el service.
// Unas rutas empiezan por "partidos" y otras por "anotaciones": @Controller() sin prefijo y rutas completas.
@Controller()
export class AnotacionController {
  constructor(private readonly anotacionService: AnotacionService) {}

  @Post('partidos/:partidoId/anotaciones') // 201 por defecto en los POST de Nest
  crear(
    @Param('partidoId', ParseIntPipe) partidoId: number,
    @Body() dto: CrearAnotacionDto,
  ): Promise<AnotacionResponseDto> {
    return this.anotacionService.crear(partidoId, dto);
  }

  @Get('partidos/:partidoId/anotaciones')
  listar(
    @Param('partidoId', ParseIntPipe) partidoId: number,
  ): Promise<AnotacionResponseDto[]> {
    return this.anotacionService.listar(partidoId);
  }

  @Put('anotaciones/:id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarAnotacionDto,
  ): Promise<AnotacionResponseDto> {
    return this.anotacionService.actualizar(id, dto);
  }

  @Delete('anotaciones/:id')
  @HttpCode(HttpStatus.NO_CONTENT) // 204 sin cuerpo (sección 5.1)
  eliminar(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.anotacionService.eliminar(id);
  }
}
