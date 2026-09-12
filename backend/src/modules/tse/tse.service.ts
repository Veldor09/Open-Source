import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { TseByCantonQueryDto, TseByDistritoQueryDto } from './dto/tse-query.dto.js';

@Injectable()
export class TseService {
  constructor(private readonly prisma: PrismaService) {}

  async getSnapshots(): Promise<string[]> {
    const rows = await this.prisma.tsePadronSnapshot.findMany({
      distinct: ['fechaSnapshot'],
      select: { fechaSnapshot: true },
      orderBy: { fechaSnapshot: 'desc' },
    });
    return rows.map((r) => r.fechaSnapshot.toISOString().slice(0, 10));
  }

  private async resolveFecha(fechaParam?: string): Promise<Date> {
    if (fechaParam) return new Date(`${fechaParam}T00:00:00.000Z`);

    const latest = await this.prisma.tsePadronSnapshot.aggregate({ _max: { fechaSnapshot: true } });
    if (!latest._max.fechaSnapshot) {
      throw new NotFoundException('No hay ningún corte del padrón importado todavía.');
    }
    return latest._max.fechaSnapshot;
  }

  async getSummary(fechaParam?: string) {
    const fechaSnapshot = await this.resolveFecha(fechaParam);
    const rows = await this.prisma.tsePadronSnapshot.findMany({ where: { fechaSnapshot } });

    const totalElectores = rows.reduce((sum, r) => sum + r.cantidadElectores, 0);
    const provincias = new Set(rows.map((r) => r.provincia));
    const cantones = new Set(rows.map((r) => `${r.provincia}|${r.canton}`));

    return {
      fechaSnapshot: fechaSnapshot.toISOString().slice(0, 10),
      totalElectores,
      totalProvincias: provincias.size,
      totalCantones: cantones.size,
      totalDistritos: rows.length,
    };
  }

  async getByProvincia(fechaParam?: string) {
    const fechaSnapshot = await this.resolveFecha(fechaParam);

    const rows = await this.prisma.tsePadronSnapshot.groupBy({
      by: ['provincia'],
      where: { fechaSnapshot },
      _sum: { cantidadElectores: true },
      orderBy: { _sum: { cantidadElectores: 'desc' } },
    });

    return rows.map((r) => ({ nombre: r.provincia, cantidadElectores: r._sum.cantidadElectores ?? 0 }));
  }

  async getByCanton(query: TseByCantonQueryDto) {
    const fechaSnapshot = await this.resolveFecha(query.fecha);
    const where = { fechaSnapshot, ...(query.provincia ? { provincia: query.provincia } : {}) };

    const rows = await this.prisma.tsePadronSnapshot.groupBy({
      by: ['canton'],
      where,
      _sum: { cantidadElectores: true },
      orderBy: { _sum: { cantidadElectores: 'desc' } },
    });

    return rows.map((r) => ({ nombre: r.canton, cantidadElectores: r._sum.cantidadElectores ?? 0 }));
  }

  async getByDistrito(query: TseByDistritoQueryDto) {
    const fechaSnapshot = await this.resolveFecha(query.fecha);
    const where = {
      fechaSnapshot,
      ...(query.provincia ? { provincia: query.provincia } : {}),
      ...(query.canton ? { canton: query.canton } : {}),
    };

    const rows = await this.prisma.tsePadronSnapshot.findMany({
      where,
      orderBy: { cantidadElectores: 'desc' },
    });

    return rows.map((r) => ({ nombre: r.distrito, cantidadElectores: r.cantidadElectores }));
  }

  async getFilterOptions() {
    const rows = await this.prisma.tsePadronSnapshot.findMany({
      distinct: ['provincia', 'canton'],
      select: { provincia: true, canton: true },
      orderBy: [{ provincia: 'asc' }, { canton: 'asc' }],
    });

    const provincias = [...new Set(rows.map((r) => r.provincia))];
    const cantonesPorProvincia: Record<string, string[]> = {};
    for (const row of rows) {
      (cantonesPorProvincia[row.provincia] ??= []).push(row.canton);
    }

    return { provincias, cantonesPorProvincia };
  }
}
