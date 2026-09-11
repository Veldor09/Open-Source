import { Module } from '@nestjs/common';
import { SicopController } from './sicop.controller.js';
import { SicopService } from './sicop.service.js';

@Module({
  controllers: [SicopController],
  providers: [SicopService],
})
export class SicopModule {}
