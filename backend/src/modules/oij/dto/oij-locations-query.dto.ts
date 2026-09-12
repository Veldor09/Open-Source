import { IsIn, IsOptional } from 'class-validator';
import { OijFilterQueryDto } from './oij-filter-query.dto.js';

export type OijLocationLevel = 'provincia' | 'canton' | 'distrito';

export class OijLocationsQueryDto extends OijFilterQueryDto {
  @IsOptional()
  @IsIn(['provincia', 'canton', 'distrito'])
  nivel?: OijLocationLevel = 'provincia';
}
