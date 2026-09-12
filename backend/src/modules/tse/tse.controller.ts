import { Controller, Get, Query } from '@nestjs/common';
import { TseByCantonQueryDto, TseByDistritoQueryDto, TseQueryDto } from './dto/tse-query.dto.js';
import { TseService } from './tse.service.js';

@Controller('tse')
export class TseController {
  constructor(private readonly tseService: TseService) {}

  @Get('snapshots')
  getSnapshots() {
    return this.tseService.getSnapshots();
  }

  @Get('summary')
  getSummary(@Query() query: TseQueryDto) {
    return this.tseService.getSummary(query.fecha);
  }

  @Get('by-provincia')
  getByProvincia(@Query() query: TseQueryDto) {
    return this.tseService.getByProvincia(query.fecha);
  }

  @Get('by-canton')
  getByCanton(@Query() query: TseByCantonQueryDto) {
    return this.tseService.getByCanton(query);
  }

  @Get('by-distrito')
  getByDistrito(@Query() query: TseByDistritoQueryDto) {
    return this.tseService.getByDistrito(query);
  }

  @Get('filters')
  getFilters() {
    return this.tseService.getFilterOptions();
  }
}
