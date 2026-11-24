import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

function aBooleanoOpcional({ value }: { value: unknown }): unknown {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
}

export class FiltrosDeporteDto {
  @IsOptional()
  @IsString({ message: 'El filtro nombre debe ser texto' })
  nombre?: string;

  @IsOptional()
  @Transform(aBooleanoOpcional)
  @IsBoolean({ message: 'El filtro activo debe ser true o false' })
  activo?: boolean;

  @IsOptional()
  @Transform(aBooleanoOpcional)
  @IsBoolean({ message: 'El filtro soloPrincipales debe ser true o false' })
  soloPrincipales?: boolean;
}
