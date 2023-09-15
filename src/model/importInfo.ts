import { IDBUpsertResult } from './db.js';

export interface IImportResult extends IDBUpsertResult {
  scraped: number;
}
