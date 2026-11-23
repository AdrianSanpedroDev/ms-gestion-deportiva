import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Matches,
  Min,
} from 'class-validator';
import { RondaFinal } from '../../fase/entities/ronda-final.enum';
// Se reutilizan los transformadores de jugador (mismo dueño, B): no se copian.
import { recortar, recortarOpcional } from '../../jugador/dto/transformadores';

// PartidoRequest (9.10): body de POST /api/fases/{faseId}/partidos. El faseId viene en la URL, no aquí.
// Solo valida FORMA. "local ≠ visitante", "equipos habilitados", "fecha dentro del torneo",
// "ronda válida para la fase" y "estado del torneo" dependen de la BD → son reglas del service.
// fechaHora llega como TEXTO "2026-12-05T15:30:00" y la entidad la guarda como Date (ver partido.entity.ts):
// - Escritura: new Date(dto.fechaHora) SIN "Z" se interpreta en hora LOCAL del proceso. La ida y vuelta
//   (texto → Date → MySQL → Date → aFechaHoraIso) solo cuadra si el proceso corre en hora de Bogotá,
//   porque hoy app.module.ts NO tiene dateStrings ni timezone.
// - TRAMPA al validar "dentro del torneo": comparar dto.fechaHora.slice(0, 10) (solo "yyyy-MM-dd")
//   con >= torneo.fechaInicio y <= torneo.fechaFin. Sin el slice, '2026-12-20T15:30:00' <= '2026-12-20'
//   da false (el texto largo es "mayor") y rechazaría un partido jugado el último día del torneo.
// Orden: los decoradores se aplican de abajo hacia arriba y gana el mensaje del más cercano a la propiedad,
// por eso @IsNotEmpty va pegado a la propiedad, encima el tipo/formato y arriba el rango.
export class CrearPartidoDto {
  @Min(1, { message: 'El id del equipo local debe ser mayor o igual a 1' })
  @IsInt({ message: 'El id del equipo local debe ser un número entero' })
  @IsNotEmpty({ message: 'El equipo local es obligatorio' })
  equipoLocalId!: number;

  @Min(1, { message: 'El id del equipo visitante debe ser mayor o igual a 1' })
  @IsInt({ message: 'El id del equipo visitante debe ser un número entero' })
  @IsNotEmpty({ message: 'El equipo visitante es obligatorio' })
  equipoVisitanteId!: number;

  // Fecha y hora ISO exacta (3, "Fecha y hora"): "2026-12-05T15:30:00".
  // @Matches fija el formato; @IsDateString strict rechaza fechas que no existen (2026-02-30T10:00:00).
  @Transform(recortar)
  @IsDateString(
    { strict: true },
    { message: 'La fecha y hora no es una fecha válida' },
  )
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, {
    message: 'La fecha y hora debe tener formato yyyy-MM-ddTHH:mm:ss',
  })
  @IsNotEmpty({ message: 'La fecha y hora es obligatoria' })
  fechaHora!: string;

  // Opcional ("cuando corresponda"): null o ausente = partido sin escenario.
  @IsOptional()
  @Min(1, { message: 'El id del escenario debe ser mayor o igual a 1' })
  @IsInt({ message: 'El id del escenario debe ser un número entero' })
  escenarioId?: number | null;

  // Solo para la fase FINAL; en un GRUPO va en null. Si es obligatoria o no lo decide el service (depende de la fase).
  @Transform(recortarOpcional) // "" → null = "no la enviaron"
  @IsOptional()
  // Los valores del mensaje se leen del enum (no se escriben a mano): si C agrega una ronda, sale sola.
  @IsEnum(RondaFinal, {
    message: `La ronda debe ser uno de estos valores: ${Object.values(RondaFinal).join(', ')}`,
  })
  ronda?: RondaFinal | null;

  // Igual que ronda: solo en la fase FINAL. El rango (1 .. llaves de la ronda) lo revisa el service.
  @IsOptional()
  @Min(1, { message: 'El número de llave debe ser mayor o igual a 1' })
  @IsInt({ message: 'El número de llave debe ser un número entero' })
  numeroLlave?: number | null;
}
