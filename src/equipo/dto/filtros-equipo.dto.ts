import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class FiltrosEquipoDto {
  @IsOptional()
  @IsString()
  nombre?: string;
  @IsOptional()
  @IsString()
  ciudad?: string;
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  activo?: boolean;
}
