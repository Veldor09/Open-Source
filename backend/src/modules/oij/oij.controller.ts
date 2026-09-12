import { Controller, Get, Query } from '@nestjs/common';
import { OijFilterQueryDto } from './dto/oij-filter-query.dto.js';
import { OijLocationsQueryDto } from './dto/oij-locations-query.dto.js';
import { OijRecordsQueryDto } from './dto/oij-records-query.dto.js';
import { OijService } from './oij.service.js';

@Controller('oij')
export class OijController {
  constructor(private readonly oijService: OijService) {}

  @Get('summary')
  getSummary(@Query() filters: OijFilterQueryDto) {
    return this.oijService.getSummary(filters);
  }

  @Get('trends')
  getTrends(@Query() filters: OijFilterQueryDto) {
    return this.oijService.getTrends(filters);
  }

  @Get('crimes')
  getCrimes(@Query() filters: OijFilterQueryDto) {
    return this.oijService.getCrimes(filters);
  }

  @Get('locations')
  getLocations(@Query() query: OijLocationsQueryDto) {
    return this.oijService.getLocations(query);
  }

  @Get('filters')
  getFilters() {
    return this.oijService.getFilters();
  }

  @Get('records')
  getRecords(@Query() query: OijRecordsQueryDto) {
    return this.oijService.getRecords(query);
  }
}
