import { Controller, Get, Query } from '@nestjs/common';
import { PronaeQueryDto } from './dto/pronae-query.dto.js';
import { PronaeService } from './pronae.service.js';

@Controller('portal-datos/pronae')
export class PronaeController {
  constructor(private readonly pronaeService: PronaeService) {}

  @Get('years')
  getYears() {
    return this.pronaeService.getYears();
  }

  @Get('summary')
  getSummary(@Query() query: PronaeQueryDto) {
    return this.pronaeService.getSummary(query.anio);
  }

  @Get('by-modality')
  getByModalidad(@Query() query: PronaeQueryDto) {
    return this.pronaeService.getByModalidad(query.anio);
  }

  @Get('trend')
  getTrend() {
    return this.pronaeService.getTrend();
  }

  @Get('table')
  getTable() {
    return this.pronaeService.getTable();
  }
}
