import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
// Se reutilizan los transformadores de jugador (mismo dueño, B): no se copian.
import { recortarOpcional } from '../../jugador/dto/transformadores';

// AnotacionRequest (9.11): body de POST /api/partidos/{partidoId}/anotaciones. El partidoId viene en la URL.
// Solo valida FORMA. "El partido está EN_JUEGO o FINALIZADO" y "el jugador tiene contrato activo con el
// local o el visitante" dependen de la BD → son reglas del service.
// Orden: gana el mensaje del decorador más cercano a la propiedad → @IsNotEmpty pegado a ella.
export class CrearAnotacionDto {
  @Min(1, { message: 'El id del jugador debe ser mayor o igual a 1' })
  @IsInt({ message: 'El id del jugador debe ser un número entero' })
  @IsNotEmpty({ message: 'El jugador es obligatorio' })
  jugadorId!: number;

  // Opcional (6.13: minuto NULL): null o ausente = "no se registró el minuto". Si viene, entero >= 0.
  @IsOptional()
  @Min(0, { message: 'El minuto debe ser mayor o igual a 0' })
  @IsInt({ message: 'El minuto debe ser un número entero' })
  minuto?: number | null;

  // Opcional: si no viene (o viene null), el mapper pone 1 (default de 6.13). Si viene, entero >= 1.
  @IsOptional()
  @Min(1, { message: 'El valor debe ser mayor o igual a 1' })
  @IsInt({ message: 'El valor debe ser un número entero' })
  valor?: number | null;

  // Opcional: "" o "   " se convierte en null (sin dato) antes de validar.
  @Transform(recortarOpcional)
  @IsOptional()
  @MaxLength(255, { message: 'La descripción admite máximo 255 caracteres' })
  @IsString({ message: 'La descripción debe ser texto' })
  descripcion?: string | null;
}
