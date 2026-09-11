import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SicopFilterQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2010)
  @Max(2100)
  anio?: number;

  /** Filtra por FECHA_ADJUD_FIRME (fecha en que la línea quedó adjudicada en firme). */
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  /** Búsqueda por subcadena (insensible a mayúsculas), no un valor exacto de una lista. */
  @IsOptional()
  @IsString()
  institucion?: string;

  @IsOptional()
  @IsString()
  proveedor?: string;

  @IsOptional()
  @IsString()
  tipoProcedimiento?: string;

  @IsOptional()
  @IsString()
  modalidadProcedimiento?: string;

  /** MONEDA_ADJUDICADA exacta ("CRC" | "USD" | ...), tal como la publica SICOP. */
  @IsOptional()
  @IsString()
  moneda?: string;
}
