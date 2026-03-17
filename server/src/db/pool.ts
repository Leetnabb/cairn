import pg from 'pg';

const { Pool } = pg;

// Single connection pool for the entire server process.
// Schema routing is done per-query by prepending the schema name.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('Unexpected PG pool error', err);
});

/**
 * Execute a query within a specific tenant schema.
 * Sets search_path for the connection for the duration of the query.
 */
export async function queryInSchema<T extends pg.QueryResultRow>(
  schemaName: string,
  text: string,
  values?: unknown[]
): Promise<pg.QueryResult<T>> {
  const client = await pool.connect();
  try {
    // Isolate tenant schema — never trust user input for schema name
    // schemaName is always generated server-side as "tenant_<uuid>"
    await client.query(`SET LOCAL search_path = "${schemaName}", cairn_public`);
    return await client.query<T>(text, values);
  } finally {
    client.release();
  }
}

/**
 * Execute a transaction within a specific tenant schema.
 */
export async function transactionInSchema<T>(
  schemaName: string,
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SET LOCAL search_path = "${schemaName}", cairn_public`);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Execute a query in the shared cairn_public schema.
 */
export async function queryPublic<T extends pg.QueryResultRow>(
  text: string,
  values?: unknown[]
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, values);
}
