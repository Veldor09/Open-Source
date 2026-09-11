import { Module } from '@nestjs/common';
import { PortalExplorerService } from './explorer/portal-explorer.service.js';
import { PortalExplorerController } from './portal-explorer.controller.js';
import { PronaeController } from './pronae.controller.js';
import { PronaeService } from './pronae.service.js';

@Module({
  controllers: [PortalExplorerController, PronaeController],
  providers: [PortalExplorerService, PronaeService],
})
export class PortalDatosModule {}
