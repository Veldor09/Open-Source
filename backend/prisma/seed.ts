import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const sources = [
  {
    sourceKey: 'oij',
    institution: 'Organismo de Investigación Judicial (OIJ) / Poder Judicial de Costa Rica',
    officialUrl: 'https://datosabiertospj.poder-judicial.go.cr/dataset/estadisticas-policiales',
  },
  {
    sourceKey: 'portal-pronae',
    institution: 'Portal Nacional de Datos Abiertos de Costa Rica / MTSS (PRONAE)',
    officialUrl: 'https://datosabiertos.gob.go.cr/dataset/mtss-personas-beneficiarias-pronae-2021-2024',
  },
  {
    sourceKey: 'tse-padron',
    institution: 'Tribunal Supremo de Elecciones (TSE)',
    officialUrl: 'https://www.tse.go.cr/descarga_padron.html',
  },
  {
    sourceKey: 'sicop',
    institution: 'Sistema Integrado de Compras Públicas (SICOP) / Ministerio de Hacienda',
    officialUrl: 'https://www.sicop.go.cr',
  },
];

async function main() {
  for (const source of sources) {
    await prisma.dataSourceStatus.upsert({
      where: { sourceKey: source.sourceKey },
      update: {},
      create: source,
    });
  }
  console.log(`Sembradas ${sources.length} fuentes (estado inicial: NOT_CONFIGURED).`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
