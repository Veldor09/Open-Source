import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { SourceStatusDto } from './dto/source-status.dto.js';

@Injectable()
export class SourcesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllStatuses(): Promise<SourceStatusDto[]> {
    return this.prisma.dataSourceStatus.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }
}
