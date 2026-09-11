export type SourceStatusValue =
  | 'AVAILABLE'
  | 'STALE'
  | 'UNAVAILABLE'
  | 'NOT_CONFIGURED'
  | 'IMPORTING'
  | 'ERROR';

export interface SourceStatus {
  sourceKey: string;
  institution: string;
  officialUrl: string;
  resourceUrl: string | null;
  resourceId: string | null;
  resourceFormat: string | null;
  sourceUpdatedAt: string | null;
  retrievedAt: string | null;
  status: SourceStatusValue;
  errorMessage: string | null;
  checksum: string | null;
  updatedAt: string;
}
