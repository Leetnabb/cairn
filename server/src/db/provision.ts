import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { PoolClient } from 'pg';
import { pool } from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SQL_DIR = resolve(__dirname, '../../../sql');

/**
 * Provision tenant schema using an existing transactional client.
 * Caller owns the BEGIN/COMMIT — this function only performs the work.
 *
 * Steps:
 * 1. Create schema
 * 2. Run tenant schema template
 * 3. Insert default strategy + scenario
 */
export async function provisionTenantSchemaInTx(
  client: PoolClient,
  schemaName: string,
  tenantId: string
): Promise<void> {
  const tenantSql = await readFile(resolve(SQL_DIR, 'init_tenant.sql'), 'utf-8');

  // Create schema — schemaName is always server-generated "tenant_<uuid>"
  await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

  // Set search path and run tenant template
  await client.query(`SET LOCAL search_path = "${schemaName}", cairn_public`);
  await client.query(tenantSql);

  // Seed default strategy and scenario
  const strategyId = crypto.randomUUID();
  const scenarioId = crypto.randomUUID();

  await client.query(
    `INSERT INTO strategies (id, name) VALUES ($1, $2)`,
    [strategyId, 'Default Strategy']
  );
  await client.query(
    `INSERT INTO scenarios (id, strategy_id, name, is_default) VALUES ($1, $2, $3, $4)`,
    [scenarioId, strategyId, 'Base Case', true]
  );

  console.log(`[provision] Schema ${schemaName} prepared for tenant ${tenantId}`);
}

/**
 * Provision a new tenant schema in its own transaction.
 * Convenience wrapper for callers that don't need to coordinate with other
 * cairn_public mutations.
 */
export async function provisionTenantSchema(schemaName: string, tenantId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await provisionTenantSchemaInTx(client, schemaName, tenantId);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Initialise the cairn_public schema (run once on startup if needed).
 */
export async function initPublicSchema(): Promise<void> {
  const sql = await readFile(resolve(SQL_DIR, 'init_public.sql'), 'utf-8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('[init] cairn_public schema initialised');
  } finally {
    client.release();
  }
}

/**
 * Drop a tenant schema (GDPR deletion — irreversible).
 */
export async function dropTenantSchema(schemaName: string): Promise<void> {
  // Extra safety: schema name must match expected pattern
  if (!/^tenant_[0-9a-f-]{32,36}$/.test(schemaName)) {
    throw new Error(`Refusing to drop schema with unexpected name: ${schemaName}`);
  }
  await pool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
  console.log(`[gdpr] Schema ${schemaName} dropped`);
}
