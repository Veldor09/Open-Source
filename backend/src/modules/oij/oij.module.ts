import { Module } from '@nestjs/common';
import { OijController } from './oij.controller.js';
import { OijService } from './oij.service.js';

@Module({
  controllers: [OijController],
  providers: [OijService],
})
export class OijModule {}
