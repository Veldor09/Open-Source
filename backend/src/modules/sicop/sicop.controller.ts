import { Controller, Get, Query } from '@nestjs/common';
import { SicopCompetitionQueryDto } from './dto/sicop-competition-query.dto.js';
import { SicopFilterQueryDto } from './dto/sicop-filter-query.dto.js';
import { SicopRecordsQueryDto } from './dto/sicop-records-query.dto.js';
import { SicopService } from './sicop.service.js';

@Controller('sicop')
export class SicopController {
  constructor(private readonly sicopService: SicopService) {}

  @Get('summary')
  getSummary(@Query() filters: SicopFilterQueryDto) {
    return this.sicopService.getSummary(filters);
  }

  @Get('trends')
  getTrends(@Query() filters: SicopFilterQueryDto) {
    return this.sicopService.getTrends(filters);
  }

  @Get('institutions')
  getInstitutions(@Query() filters: SicopFilterQueryDto) {
    return this.sicopService.getInstitutions(filters);
  }

  @Get('suppliers')
  getSuppliers(@Query() filters: SicopFilterQueryDto) {
    return this.sicopService.getSuppliers(filters);
  }

  @Get('categories')
  getCategories(@Query() filters: SicopFilterQueryDto) {
    return this.sicopService.getCategories(filters);
  }

  @Get('filters')
  getFilters() {
    return this.sicopService.getFilters();
  }

  @Get('records')
  getRecords(@Query() query: SicopRecordsQueryDto) {
    return this.sicopService.getRecords(query);
  }

  @Get('competition')
  getCompetition(@Query() filters: SicopCompetitionQueryDto) {
    return this.sicopService.getCompetition(filters);
  }
}
