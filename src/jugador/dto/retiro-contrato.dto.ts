import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, Matches } from 'class-validator';
import { recortarOpcional } from './transformadores';

// Body de PATCH /api/equipos/{equipoId}/jugadores/{jugadorId}/retiro (9.8): { "fechaRetiro": "2026-12-01" }.
// Es opcional: si no viene (o viene vacía), el service usa la fecha de hoy en Bogotá.
// Orden: gana el mensaje del decorador más cercano a la propiedad → primero el formato (@Matches).
export class RetiroContratoDto {
  @Transform(recortarOpcional) // "" → null = "no la enviaron"
  @IsOptional()
  @IsDateString(
    { strict: true },
    { message: 'La fecha de retiro no es una fecha válida' },
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha de retiro debe tener formato yyyy-MM-dd',
  })
  fechaRetiro?: string | null;
}
