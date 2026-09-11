export class SchemaMismatchError extends Error {
  constructor(message: string) {
    super(`[schema mismatch] ${message}`);
    this.name = 'SchemaMismatchError';
  }
}
