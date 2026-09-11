import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Filtro propio para /sicop/competition, distinto de SicopFilterQueryDto:
 * Ofertas.csv no tiene moneda, tipo de procedimiento ni nombre de
 * institución, así que esos filtros del panel general no aplican aquí sin
 * un join de cobertura parcial (ver README). Sí aplican `anio`/rango de
 * fecha (FECHA_PRESENTA_OFERTA, propia de este archivo) y `proveedor`
 * (join confiable con SicopProveedor, que es una foto completa).
 */
export class SicopCompetitionQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2010)
  @Max(2100)
  anio?: number;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsString()
  proveedor?: string;
}
