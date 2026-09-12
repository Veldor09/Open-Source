import { Module } from '@nestjs/common';
import { TseController } from './tse.controller.js';
import { TseService } from './tse.service.js';

@Module({
  controllers: [TseController],
  providers: [TseService],
})
export class TseModule {}
