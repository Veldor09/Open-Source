import { IsOptional, IsString } from 'class-validator';

export class PortalSearchQueryDto {
  @IsOptional()
  @IsString()
  q?: string;
}
