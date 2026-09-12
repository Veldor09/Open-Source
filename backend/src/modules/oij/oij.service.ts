import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import { OijFilterQueryDto } from './dto/oij-filter-query.dto.js';
import { OijLocationsQueryDto } from './dto/oij-locations-query.dto.js';
import { OijRecordsQueryDto } from './dto/oij-records-query.dto.js';

@Injectable()
export class OijService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(filters: OijFilterQueryDto): Prisma.OijIncidenteWhereInput {
    const where: Prisma.OijIncidenteWhereInput = {};

    if (filters.anio) where.anio = filters.anio;
    if (filters.delito) where.delito = filters.delito;
    if (filters.provincia) where.provincia = filters.provincia;
    if (filters.canton) where.canton = filters.canton;
    if (filters.fechaInicio || filters.fechaFin) {
      where.fecha = {
        ...(filters.fechaInicio ? { gte: new Date(filters.fechaInicio) } : {}),
        ...(filters.fechaFin ? { lte: new Date(filters.fechaFin) } : {}),
      };
    }

    return where;
  }

  private buildRawConditions(filters: OijFilterQueryDto): Prisma.Sql[] {
    const conditions: Prisma.Sql[] = [];

    if (filters.anio) conditions.push(Prisma.sql`"anio" = ${filters.anio}`);
    if (filters.delito) conditions.push(Prisma.sql`"delito" = ${filters.delito}`);
    if (filters.provincia) conditions.push(Prisma.sql`"provincia" = ${filters.provincia}`);
    if (filters.canton) conditions.push(Prisma.sql`"canton" = ${filters.canton}`);
    if (filters.fechaInicio) conditions.push(Prisma.sql`"fecha" >= ${new Date(filters.fechaInicio)}`);
    if (filters.fechaFin) conditions.push(Prisma.sql`"fecha" <= ${new Date(filters.fechaFin)}`);

    return conditions;
  }

  async getSummary(filters: OijFilterQueryDto) {
    const where = this.buildWhere(filters);
    const [total, delitos, provincias, rango] = await Promise.all([
      this.prisma.oijIncidente.count({ where }),
      this.prisma.oijIncidente.groupBy({ by: ['delito'], where }),
      this.prisma.oijIncidente.groupBy({ by: ['provincia'], where }),
      this.prisma.oijIncidente.aggregate({ where, _min: { fecha: true }, _max: { fecha: true } }),
    ]);

    return {
      totalRegistros: total,
      delitosDistintos: delitos.length,
      provinciasDistintas: provincias.length,
      fechaMinima: rango._min.fecha,
      fechaMaxima: rango._max.fecha,
    };
  }

  async getTrends(filters: OijFilterQueryDto) {
    const conditions = this.buildRawConditions(filters);
    const whereClause = conditions.length ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty;

    const rows = await this.prisma.$queryRaw<{ mes: Date; total: bigint }[]>(Prisma.sql`
      SELECT date_trunc('month', "fecha") AS mes, COUNT(*)::bigint AS total
      FROM "OijIncidente"
      ${whereClause}
      GROUP BY mes
      ORDER BY mes ASC
    `);

    return rows.map((r) => ({ mes: r.mes, total: Number(r.total) }));
  }

  async getCrimes(filters: OijFilterQueryDto) {
    const where = this.buildWhere(filters);
    const rows = await this.prisma.oijIncidente.groupBy({
      by: ['delito'],
      where,
      _count: { _all: true },
      orderBy: { _count: { delito: 'desc' } },
      take: 15,
    });

    return rows.map((r) => ({ delito: r.delito, total: r._count._all }));
  }

  async getLocations(filters: OijLocationsQueryDto) {
    const { nivel = 'provincia', ...rest } = filters;
    const where = this.buildWhere(rest);

    if (nivel === 'canton') {
      const rows = await this.prisma.oijIncidente.groupBy({
        by: ['canton'],
        where,
        _count: { _all: true },
        orderBy: { _count: { canton: 'desc' } },
        take: 30,
      });
      return rows.map((r) => ({ nombre: r.canton, total: r._count._all }));
    }

    if (nivel === 'distrito') {
      const rows = await this.prisma.oijIncidente.groupBy({
        by: ['distrito'],
        where,
        _count: { _all: true },
        orderBy: { _count: { distrito: 'desc' } },
        take: 30,
      });
      return rows.map((r) => ({ nombre: r.distrito, total: r._count._all }));
    }

    const rows = await this.prisma.oijIncidente.groupBy({
      by: ['provincia'],
      where,
      _count: { _all: true },
      orderBy: { _count: { provincia: 'desc' } },
      take: 30,
    });
    return rows.map((r) => ({ nombre: r.provincia, total: r._count._all }));
  }

  async getFilters() {
    const [delitos, provincias, cantones, anios] = await Promise.all([
      this.prisma.oijIncidente.findMany({
        distinct: ['delito'],
        select: { delito: true },
        orderBy: { delito: 'asc' },
      }),
      this.prisma.oijIncidente.findMany({
        distinct: ['provincia'],
        select: { provincia: true },
        orderBy: { provincia: 'asc' },
      }),
      this.prisma.oijIncidente.findMany({
        distinct: ['canton'],
        select: { canton: true },
        orderBy: { canton: 'asc' },
      }),
      this.prisma.oijIncidente.findMany({
        distinct: ['anio'],
        select: { anio: true },
        orderBy: { anio: 'desc' },
      }),
    ]);

    return {
      delitos: delitos.map((d) => d.delito),
      provincias: provincias.map((p) => p.provincia),
      cantones: cantones.map((c) => c.canton),
      anios: anios.map((a) => a.anio),
    };
  }

  async getRecords(query: OijRecordsQueryDto) {
    const { page = 1, pageSize = 20, ...filters } = query;
    const where = this.buildWhere(filters);

    const [rows, total] = await Promise.all([
      this.prisma.oijIncidente.findMany({
        where,
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.oijIncidente.count({ where }),
    ]);

    return { rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }
}
