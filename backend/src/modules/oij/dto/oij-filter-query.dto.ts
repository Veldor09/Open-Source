import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class OijFilterQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2015)
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
  delito?: string;

  @IsOptional()
  @IsString()
  provincia?: string;

  @IsOptional()
  @IsString()
  canton?: string;
}
