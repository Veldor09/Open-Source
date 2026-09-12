import { IsDateString, IsOptional, IsString } from 'class-validator';

export class TseQueryDto {
  @IsOptional()
  @IsDateString()
  fecha?: string;
}

export class TseByCantonQueryDto extends TseQueryDto {
  @IsOptional()
  @IsString()
  provincia?: string;
}

export class TseByDistritoQueryDto extends TseByCantonQueryDto {
  @IsOptional()
  @IsString()
  canton?: string;
}
