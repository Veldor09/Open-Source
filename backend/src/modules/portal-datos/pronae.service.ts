import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class PronaeService {
  constructor(private readonly prisma: PrismaService) {}

  async getYears(): Promise<number[]> {
    const rows = await this.prisma.pronaeBeneficiario.findMany({
      distinct: ['anio'],
      select: { anio: true },
      orderBy: { anio: 'asc' },
    });
    return rows.map((r) => r.anio);
  }

  private async resolveYear(anio?: number): Promise<number> {
    if (anio) return anio;

    const latest = await this.prisma.pronaeBeneficiario.aggregate({ _max: { anio: true } });
    if (!latest._max.anio) {
      throw new NotFoundException('No hay datos de PRONAE importados todavía.');
    }
    return latest._max.anio;
  }

  async getSummary(anioParam?: number) {
    const anio = await this.resolveYear(anioParam);

    const rows = await this.prisma.pronaeBeneficiario.findMany({ where: { anio } });
    const totalBeneficiarios = rows.reduce((sum, r) => sum + r.cantidad, 0);
    const activas = rows.filter((r) => r.cantidad > 0);
    const principal = activas.sort((a, b) => b.cantidad - a.cantidad)[0] ?? null;

    return {
      anio,
      totalBeneficiarios,
      modalidadesActivas: activas.length,
      modalidadPrincipal: principal ? { modalidad: principal.modalidad, cantidad: principal.cantidad } : null,
    };
  }

  async getByModalidad(anioParam?: number) {
    const anio = await this.resolveYear(anioParam);

    const rows = await this.prisma.pronaeBeneficiario.findMany({
      where: { anio },
      orderBy: { cantidad: 'desc' },
    });

    return rows.map((r) => ({ modalidad: r.modalidad, cantidad: r.cantidad }));
  }

  async getTrend() {
    const rows = await this.prisma.pronaeBeneficiario.groupBy({
      by: ['anio'],
      _sum: { cantidad: true },
      orderBy: { anio: 'asc' },
    });

    return rows.map((r) => ({ anio: r.anio, total: r._sum.cantidad ?? 0 }));
  }

  async getTable() {
    const [anios, rows] = await Promise.all([this.getYears(), this.prisma.pronaeBeneficiario.findMany()]);

    const byModalidad = new Map<string, Record<number, number>>();
    for (const row of rows) {
      if (!byModalidad.has(row.modalidad)) {
        byModalidad.set(row.modalidad, {});
      }
      byModalidad.get(row.modalidad)![row.anio] = row.cantidad;
    }

    const tabla = [...byModalidad.entries()]
      .map(([modalidad, valores]) => ({ modalidad, valores }))
      .sort((a, b) => a.modalidad.localeCompare(b.modalidad, 'es'));

    return { anios, tabla };
  }
}
