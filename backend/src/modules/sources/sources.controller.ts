import { Controller, Get } from '@nestjs/common';
import { SourceStatusDto } from './dto/source-status.dto.js';
import { SourcesService } from './sources.service.js';

@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get('status')
  getStatus(): Promise<SourceStatusDto[]> {
    return this.sourcesService.findAllStatuses();
  }
}
