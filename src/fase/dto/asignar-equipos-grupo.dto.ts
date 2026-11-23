import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';

// Body de POST /api/grupos/{grupoId}/equipos (HU-GC-04, ACUERDOS 9.15).
export class AsignarEquiposGrupoDto {
  @ArrayUnique({
    message: 'La lista de equipos no puede contener identificadores duplicados',
  })
  @Min(1, {
    each: true,
    message: 'Cada identificador de equipo debe ser mayor o igual a 1',
  })
  @IsInt({
    each: true,
    message: 'Cada identificador de equipo debe ser un número entero',
  })
  @ArrayNotEmpty({ message: 'Debe enviar al menos un equipo para asignar' })
  @IsArray({ message: 'equipoIds debe ser un arreglo de identificadores' })
  equipoIds!: number[];
}
