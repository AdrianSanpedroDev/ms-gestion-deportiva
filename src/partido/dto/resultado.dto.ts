import { IsInt, IsNotEmpty, Min } from 'class-validator';

// Body de PUT /api/partidos/{id}/resultado (9.11): { "marcadorLocal": 2, "marcadorVisitante": 1 }.
// Solo valida FORMA (enteros >= 0, obligatorios). "Solo en EN_JUEGO o FINALIZADO" y "torneo sin finalizar"
// dependen de la BD → service. Con dos campos fijos (local y visitante) no se puede dar resultado
// a un equipo que no juega el partido (criterio de la HU).
// Orden: gana el mensaje del decorador más cercano a la propiedad → @IsNotEmpty pegado a ella.
// @IsNotEmpty deja pasar el 0 (solo rechaza "", null y undefined): un 0 - 0 es un resultado válido.
export class ResultadoDto {
  @Min(0, { message: 'El marcador local debe ser mayor o igual a 0' })
  @IsInt({ message: 'El marcador local debe ser un número entero' })
  @IsNotEmpty({ message: 'El marcador local es obligatorio' })
  marcadorLocal!: number;

  @Min(0, { message: 'El marcador visitante debe ser mayor o igual a 0' })
  @IsInt({ message: 'El marcador visitante debe ser un número entero' })
  @IsNotEmpty({ message: 'El marcador visitante es obligatorio' })
  marcadorVisitante!: number;
}
