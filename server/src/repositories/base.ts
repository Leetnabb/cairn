import { queryInSchema, transactionInSchema } from '../db/pool.js';
import type pg from 'pg';

/**
 * Base repository class.
 * All queries are scoped to a specific tenant schema via search_path.
 * tenantId is injected at construction time and mandatory on every operation.
 */
export abstract class BaseRepository {
  protected readonly schemaName: string;
  protected readonly tenantId: string;

  constructor(schemaName: string, tenantId: string) {
    this.schemaName = schemaName;
    this.tenantId = tenantId;
  }

  protected async query<T extends pg.QueryResultRow>(
    text: string,
    values?: unknown[]
  ): Promise<pg.QueryResult<T>> {
    return queryInSchema<T>(this.schemaName, text, values);
  }

  protected async transaction<T>(
    fn: (client: pg.PoolClient) => Promise<T>
  ): Promise<T> {
    return transactionInSchema<T>(this.schemaName, fn);
  }

  /** Map snake_case DB row to camelCase object */
  protected toCamel<T>(row: Record<string, unknown>): T {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
      result[camelKey] = value;
    }
    return result as T;
  }

  protected rowsToCamel<T>(rows: Record<string, unknown>[]): T[] {
    return rows.map(r => this.toCamel<T>(r));
  }
}
