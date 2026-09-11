import { SourceStatus } from '../../../generated/prisma/client.js';

export class SourceStatusDto {
  sourceKey!: string;
  institution!: string;
  officialUrl!: string;
  resourceUrl!: string | null;
  resourceId!: string | null;
  resourceFormat!: string | null;
  sourceUpdatedAt!: Date | null;
  retrievedAt!: Date | null;
  status!: SourceStatus;
  errorMessage!: string | null;
  checksum!: string | null;
  updatedAt!: Date;
}
