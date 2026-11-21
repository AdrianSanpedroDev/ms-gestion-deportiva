import { IsDateString, IsInt, IsNotEmpty, Matches, Min } from 'class-validator';

// ContratoRequest (9.8): body de POST /api/equipos/{equipoId}/jugadores. El equipoId viene en la URL, no aquí.
// Solo valida FORMA. "fechaFin > fechaInicio", "existe", "activo" y "sin duplicado" son reglas → service.
// Orden: los decoradores se aplican de abajo hacia arriba y gana el mensaje del más cercano a la propiedad,
// por eso @IsNotEmpty va pegado a la propiedad.
export class CrearContratoDto {
  @Min(1, { message: 'El id del jugador debe ser mayor o igual a 1' })
  @IsInt({ message: 'El id del jugador debe ser un número entero' })
  @IsNotEmpty({ message: 'El jugador es obligatorio' })
  jugadorId!: number;

  @IsDateString(
    { strict: true },
    { message: 'La fecha de inicio no es una fecha válida' },
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha de inicio debe tener formato yyyy-MM-dd',
  })
  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria' })
  fechaInicio!: string;

  @IsDateString(
    { strict: true },
    { message: 'La fecha de fin no es una fecha válida' },
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha de fin debe tener formato yyyy-MM-dd',
  })
  @IsNotEmpty({ message: 'La fecha de fin es obligatoria' })
  fechaFin!: string;
}
