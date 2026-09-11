import { Controller, Get, Param, Query } from '@nestjs/common';
import { PortalSearchQueryDto } from './dto/portal-search-query.dto.js';
import { PortalExplorerService } from './explorer/portal-explorer.service.js';

@Controller('portal-datos/datasets')
export class PortalExplorerController {
  constructor(private readonly explorerService: PortalExplorerService) {}

  @Get()
  search(@Query() query: PortalSearchQueryDto) {
    return this.explorerService.search(query.q);
  }

  @Get(':id')
  getDataset(@Param('id') id: string) {
    return this.explorerService.getDataset(id);
  }
}
