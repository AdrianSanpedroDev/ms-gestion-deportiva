import { IsInt, IsNotEmpty, Min } from 'class-validator';

// Body de POST /api/jugadores/{jugadorId}/habilidades (ACUERDOS 9.12).
// Solo valida FORMA; existencia, estado activo del jugador y duplicidad se validan en el service.
// Orden de decoradores: de abajo hacia arriba gana el más cercano a la propiedad (@IsNotEmpty).
export class AsignarHabilidadDto {
  @Min(1, { message: 'El id de la habilidad debe ser mayor o igual a 1' })
  @IsInt({ message: 'El id de la habilidad debe ser un número entero' })
  @IsNotEmpty({ message: 'La habilidad es obligatoria' })
  habilidadId!: number;
}
