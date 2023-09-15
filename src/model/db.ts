import { IEvent } from './event.js';

export interface DBSchema {
  events: IEvent[];
}

export interface IEventQuery {
  origin?: string;
  text?: string;
  categories?: string[];
  nextWeekend?: boolean;
  limit?: number;
}

export interface IDBUpsertResult {
  created: number;
  updated: number;
  deleted: number;
}
