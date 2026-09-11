import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import { SicopCompetitionQueryDto } from './dto/sicop-competition-query.dto.js';
import { SicopFilterQueryDto } from './dto/sicop-filter-query.dto.js';
import { SicopRecordsQueryDto } from './dto/sicop-records-query.dto.js';

const TOP_N = 15;
const COMPETITION_BUCKETS = ['1', '2-3', '4-6', '7+'] as const;

function competitionBucket(proveedores: number): (typeof COMPETITION_BUCKETS)[number] {
  if (proveedores === 1) return '1';
  if (proveedores <= 3) return '2-3';
  if (proveedores <= 6) return '4-6';
  return '7+';
}

@Injectable()
export class SicopService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(filters: SicopFilterQueryDto): Prisma.SicopLineaAdjudicadaWhereInput {
    const where: Prisma.SicopLineaAdjudicadaWhereInput = {};

    if (filters.anio) where.anio = filters.anio;
    if (filters.tipoProcedimiento) where.tipoProcedimiento = filters.tipoProcedimiento;
    if (filters.modalidadProcedimiento) where.modalidadProcedimiento = filters.modalidadProcedimiento;
    if (filters.moneda) where.monedaAdjudicada = filters.moneda;
    if (filters.institucion) where.institucion = { contains: filters.institucion, mode: 'insensitive' };
    if (filters.proveedor) where.nombreProveedor = { contains: filters.proveedor, mode: 'insensitive' };
    if (filters.fechaInicio || filters.fechaFin) {
      where.fechaAdjudicacionFirme = {
        ...(filters.fechaInicio ? { gte: new Date(filters.fechaInicio) } : {}),
        ...(filters.fechaFin ? { lte: new Date(filters.fechaFin) } : {}),
      };
    }

    return where;
  }

  /** Condiciones equivalentes a buildWhere() pero para $queryRaw, con alias de tabla configurable. */
  private buildRawConditions(filters: SicopFilterQueryDto, alias = 'l'): Prisma.Sql[] {
    const col = (name: string) => Prisma.raw(`"${alias}"."${name}"`);
    const conditions: Prisma.Sql[] = [];

    if (filters.anio) conditions.push(Prisma.sql`${col('anio')} = ${filters.anio}`);
    if (filters.tipoProcedimiento) conditions.push(Prisma.sql`${col('tipoProcedimiento')} = ${filters.tipoProcedimiento}`);
    if (filters.modalidadProcedimiento)
      conditions.push(Prisma.sql`${col('modalidadProcedimiento')} = ${filters.modalidadProcedimiento}`);
    if (filters.moneda) conditions.push(Prisma.sql`${col('monedaAdjudicada')} = ${filters.moneda}`);
    if (filters.institucion) conditions.push(Prisma.sql`${col('institucion')} ILIKE ${'%' + filters.institucion + '%'}`);
    if (filters.proveedor) conditions.push(Prisma.sql`${col('nombreProveedor')} ILIKE ${'%' + filters.proveedor + '%'}`);
    if (filters.fechaInicio) conditions.push(Prisma.sql`${col('fechaAdjudicacionFirme')} >= ${new Date(filters.fechaInicio)}`);
    if (filters.fechaFin) conditions.push(Prisma.sql`${col('fechaAdjudicacionFirme')} <= ${new Date(filters.fechaFin)}`);

    return conditions;
  }

  async getSummary(filters: SicopFilterQueryDto) {
    const where = this.buildWhere(filters);
    const [totalLineas, montoAgg, instituciones, proveedores, procedimientos, rango, porMoneda, lineasSinEquivalenteCrc] =
      await Promise.all([
        this.prisma.sicopLineaAdjudicada.count({ where }),
        this.prisma.sicopLineaAdjudicada.aggregate({ where, _sum: { montoLineaAdjudicadaCrc: true } }),
        this.prisma.sicopLineaAdjudicada.findMany({
          where,
          distinct: ['cedulaInstitucion'],
          select: { cedulaInstitucion: true },
        }),
        this.prisma.sicopLineaAdjudicada.findMany({
          where,
          distinct: ['cedulaProveedor'],
          select: { cedulaProveedor: true },
        }),
        this.prisma.sicopLineaAdjudicada.findMany({ where, distinct: ['nroSicop'], select: { nroSicop: true } }),
        this.prisma.sicopLineaAdjudicada.aggregate({
          where,
          _min: { fechaAdjudicacionFirme: true },
          _max: { fechaAdjudicacionFirme: true },
        }),
        this.prisma.sicopLineaAdjudicada.groupBy({
          by: ['monedaAdjudicada'],
          where,
          _sum: { montoLineaAdjudicada: true },
          _count: { _all: true },
        }),
        this.prisma.sicopLineaAdjudicada.count({ where: { ...where, montoLineaAdjudicadaCrc: null } }),
      ]);

    return {
      totalLineas,
      totalProcedimientos: procedimientos.length,
      institucionesDistintas: instituciones.length,
      proveedoresDistintos: proveedores.length,
      // Suma en colones usando el equivalente que la propia SICOP publica por línea
      // (MONTO_ADJU_LINEA_CRC) — nunca una conversión calculada por este proyecto.
      montoTotalAdjudicadoCrc: montoAgg._sum.montoLineaAdjudicadaCrc ?? 0,
      lineasSinEquivalenteCrc,
      fechaMinima: rango._min.fechaAdjudicacionFirme,
      fechaMaxima: rango._max.fechaAdjudicacionFirme,
      porMoneda: porMoneda.map((r) => ({
        moneda: r.monedaAdjudicada,
        totalLineas: r._count._all,
        montoOriginal: r._sum.montoLineaAdjudicada ?? 0,
      })),
    };
  }

  async getTrends(filters: SicopFilterQueryDto) {
    const conditions = [
      Prisma.sql`"l"."fechaAdjudicacionFirme" IS NOT NULL`,
      ...this.buildRawConditions(filters),
    ];
    const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

    const rows = await this.prisma.$queryRaw<{ mes: Date; montoCrc: number | null; totalLineas: bigint }[]>(Prisma.sql`
      SELECT
        date_trunc('month', "l"."fechaAdjudicacionFirme") AS mes,
        SUM("l"."montoLineaAdjudicadaCrc") AS "montoCrc",
        COUNT(*)::bigint AS "totalLineas"
      FROM "SicopLineaAdjudicada" "l"
      ${whereClause}
      GROUP BY mes
      ORDER BY mes ASC
    `);

    return rows.map((r) => ({ mes: r.mes, montoCrc: Number(r.montoCrc ?? 0), totalLineas: Number(r.totalLineas) }));
  }

  async getInstitutions(filters: SicopFilterQueryDto) {
    const where = this.buildWhere(filters);
    const rows = await this.prisma.sicopLineaAdjudicada.groupBy({
      by: ['cedulaInstitucion', 'institucion'],
      where,
      _sum: { montoLineaAdjudicadaCrc: true },
      _count: { _all: true },
      orderBy: { _sum: { montoLineaAdjudicadaCrc: 'desc' } },
      take: TOP_N,
    });

    return rows.map((r) => ({
      cedula: r.cedulaInstitucion,
      nombre: r.institucion,
      montoCrc: r._sum.montoLineaAdjudicadaCrc ?? 0,
      totalLineas: r._count._all,
    }));
  }

  async getSuppliers(filters: SicopFilterQueryDto) {
    const where = this.buildWhere(filters);
    const rows = await this.prisma.sicopLineaAdjudicada.groupBy({
      by: ['cedulaProveedor', 'nombreProveedor'],
      where,
      _sum: { montoLineaAdjudicadaCrc: true },
      _count: { _all: true },
      orderBy: { _sum: { montoLineaAdjudicadaCrc: 'desc' } },
      take: TOP_N,
    });

    const perfiles = await this.prisma.sicopProveedor.findMany({
      where: { cedula: { in: rows.map((r) => r.cedulaProveedor) } },
      select: { cedula: true, tipoProveedor: true, tamanoProveedor: true },
    });
    const perfilPorCedula = new Map(perfiles.map((p) => [p.cedula, p]));

    return rows.map((r) => ({
      cedula: r.cedulaProveedor,
      nombre: r.nombreProveedor,
      montoCrc: r._sum.montoLineaAdjudicadaCrc ?? 0,
      totalLineas: r._count._all,
      tipoProveedor: perfilPorCedula.get(r.cedulaProveedor)?.tipoProveedor ?? null,
      tamanoProveedor: perfilPorCedula.get(r.cedulaProveedor)?.tamanoProveedor ?? null,
    }));
  }

  async getCategories(filters: SicopFilterQueryDto) {
    const where = this.buildWhere(filters);
    const [porTipo, porModalidad] = await Promise.all([
      this.prisma.sicopLineaAdjudicada.groupBy({
        by: ['tipoProcedimiento'],
        where,
        _sum: { montoLineaAdjudicadaCrc: true },
        _count: { _all: true },
        orderBy: { _sum: { montoLineaAdjudicadaCrc: 'desc' } },
      }),
      this.prisma.sicopLineaAdjudicada.groupBy({
        by: ['modalidadProcedimiento'],
        where,
        _sum: { montoLineaAdjudicadaCrc: true },
        _count: { _all: true },
        orderBy: { _sum: { montoLineaAdjudicadaCrc: 'desc' } },
      }),
    ]);

    // CLAS_OBJ (bienes/servicios) solo existe en DetalleCarteles.csv, no en la
    // línea adjudicada — se une por NRO_SICOP en SQL (sin declarar una relación
    // de Prisma, igual que el resto del proyecto).
    const conditions = [
      Prisma.sql`"p"."clasificacionObjeto" IS NOT NULL`,
      ...this.buildRawConditions(filters),
    ];
    const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
    const porClasificacion = await this.prisma.$queryRaw<{ nombre: string; montoCrc: number | null; totalLineas: bigint }[]>(
      Prisma.sql`
        SELECT p."clasificacionObjeto" AS nombre, SUM(l."montoLineaAdjudicadaCrc") AS "montoCrc", COUNT(*)::bigint AS "totalLineas"
        FROM "SicopLineaAdjudicada" l
        JOIN "SicopProcedimiento" p ON p."nroSicop" = l."nroSicop"
        ${whereClause}
        GROUP BY p."clasificacionObjeto"
        ORDER BY "montoCrc" DESC
      `,
    );

    return {
      porTipoProcedimiento: porTipo.map((r) => ({
        nombre: r.tipoProcedimiento,
        montoCrc: r._sum.montoLineaAdjudicadaCrc ?? 0,
        totalLineas: r._count._all,
      })),
      porModalidad: porModalidad.map((r) => ({
        nombre: r.modalidadProcedimiento,
        montoCrc: r._sum.montoLineaAdjudicadaCrc ?? 0,
        totalLineas: r._count._all,
      })),
      porClasificacionObjeto: porClasificacion.map((r) => ({
        nombre: r.nombre,
        montoCrc: Number(r.montoCrc ?? 0),
        totalLineas: Number(r.totalLineas),
      })),
    };
  }

  async getFilters() {
    const [tipos, modalidades, monedas, anios] = await Promise.all([
      this.prisma.sicopLineaAdjudicada.findMany({
        distinct: ['tipoProcedimiento'],
        select: { tipoProcedimiento: true },
        orderBy: { tipoProcedimiento: 'asc' },
      }),
      this.prisma.sicopLineaAdjudicada.findMany({
        distinct: ['modalidadProcedimiento'],
        select: { modalidadProcedimiento: true },
        orderBy: { modalidadProcedimiento: 'asc' },
      }),
      this.prisma.sicopLineaAdjudicada.findMany({
        distinct: ['monedaAdjudicada'],
        select: { monedaAdjudicada: true },
        orderBy: { monedaAdjudicada: 'asc' },
      }),
      this.prisma.sicopLineaAdjudicada.findMany({
        distinct: ['anio'],
        select: { anio: true },
        orderBy: { anio: 'desc' },
      }),
    ]);

    return {
      tiposProcedimiento: tipos.map((t) => t.tipoProcedimiento),
      modalidades: modalidades.map((m) => m.modalidadProcedimiento),
      monedas: monedas.map((m) => m.monedaAdjudicada),
      anios: anios.map((a) => a.anio),
    };
  }

  async getRecords(query: SicopRecordsQueryDto) {
    const { page = 1, pageSize = 20, ...filters } = query;
    const where = this.buildWhere(filters);

    const [rows, total] = await Promise.all([
      this.prisma.sicopLineaAdjudicada.findMany({
        where,
        orderBy: { fechaAdjudicacionFirme: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.sicopLineaAdjudicada.count({ where }),
    ]);

    return { rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  /**
   * Indicador de competencia: cuántos proveedores DISTINTOS compitieron por
   * cada procedimiento. Deliberadamente NO cuenta filas de SicopOferta ni
   * NRO_OFERTA distintos — verificado con datos reales que un mismo
   * proveedor puede tener cientos de filas para el mismo NRO_SICOP (ver
   * comentario en schema.prisma sobre SicopOferta). Solo filtra por
   * `anio`/rango de fecha (propios de Ofertas.csv) y `proveedor` (join
   * confiable con SicopProveedor) — no por institución/tipo/modalidad, que
   * requerirían un join de cobertura parcial con SicopProcedimiento.
   */
  async getCompetition(filters: SicopCompetitionQueryDto) {
    const conditions: Prisma.Sql[] = [];
    if (filters.anio) conditions.push(Prisma.sql`EXTRACT(YEAR FROM "o"."fechaPresentacion") = ${filters.anio}`);
    if (filters.fechaInicio) conditions.push(Prisma.sql`"o"."fechaPresentacion" >= ${new Date(filters.fechaInicio)}`);
    if (filters.fechaFin) conditions.push(Prisma.sql`"o"."fechaPresentacion" <= ${new Date(filters.fechaFin)}`);
    if (filters.proveedor) conditions.push(Prisma.sql`"prov"."nombre" ILIKE ${'%' + filters.proveedor + '%'}`);
    const whereClause = conditions.length ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty;

    const rows = await this.prisma.$queryRaw<{ nroSicop: string; proveedores: number; totalOfertas: number }[]>(
      Prisma.sql`
        SELECT o."nroSicop", COUNT(DISTINCT o."cedulaProveedor")::int AS proveedores, COUNT(*)::int AS "totalOfertas"
        FROM "SicopOferta" o
        LEFT JOIN "SicopProveedor" prov ON prov."cedula" = o."cedulaProveedor"
        ${whereClause}
        GROUP BY o."nroSicop"
      `,
    );

    const totalProcedimientos = rows.length;
    const sumaProveedores = rows.reduce((acc, r) => acc + r.proveedores, 0);
    const procedimientosUnProveedor = rows.filter((r) => r.proveedores === 1).length;

    const distribucionMap = new Map<string, number>();
    for (const r of rows) {
      const bucket = competitionBucket(r.proveedores);
      distribucionMap.set(bucket, (distribucionMap.get(bucket) ?? 0) + 1);
    }

    return {
      totalProcedimientos,
      promedioProveedoresPorProcedimiento: totalProcedimientos > 0 ? sumaProveedores / totalProcedimientos : 0,
      procedimientosUnProveedor,
      porcentajeUnProveedor: totalProcedimientos > 0 ? (procedimientosUnProveedor / totalProcedimientos) * 100 : 0,
      distribucion: COMPETITION_BUCKETS.filter((b) => distribucionMap.has(b)).map((b) => ({
        proveedores: b,
        procedimientos: distribucionMap.get(b)!,
      })),
      masCompetidos: [...rows]
        .sort((a, b) => b.proveedores - a.proveedores)
        .slice(0, 10)
        .map((r) => ({ nroSicop: r.nroSicop, proveedoresDistintos: r.proveedores, totalOfertas: r.totalOfertas })),
    };
  }
}
