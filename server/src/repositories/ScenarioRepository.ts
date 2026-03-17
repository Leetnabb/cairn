import { BaseRepository } from './base.js';
import type { Scenario } from '../types/index.js';

export class ScenarioRepository extends BaseRepository {
  async findAll(): Promise<Scenario[]> {
    const { rows } = await this.query<Record<string, unknown>>(
      `SELECT id, strategy_id, name, is_default, created_at, updated_at
       FROM scenarios ORDER BY created_at ASC`
    );
    return this.rowsToCamel<Scenario>(rows);
  }

  async findById(id: string): Promise<Scenario | null> {
    const { rows } = await this.query<Record<string, unknown>>(
      `SELECT id, strategy_id, name, is_default, created_at, updated_at
       FROM scenarios WHERE id = $1`,
      [id]
    );
    return rows[0] ? this.toCamel<Scenario>(rows[0]) : null;
  }

  async create(data: { name: string; strategyId?: string }): Promise<Scenario> {
    const { rows } = await this.query<Record<string, unknown>>(
      `INSERT INTO scenarios (id, strategy_id, name, is_default)
       VALUES (gen_random_uuid(), $1, $2, false)
       RETURNING id, strategy_id, name, is_default, created_at, updated_at`,
      [data.strategyId ?? null, data.name]
    );
    return this.toCamel<Scenario>(rows[0]);
  }

  async update(id: string, data: { name?: string }): Promise<Scenario | null> {
    const { rows } = await this.query<Record<string, unknown>>(
      `UPDATE scenarios SET name = COALESCE($2, name)
       WHERE id = $1
       RETURNING id, strategy_id, name, is_default, created_at, updated_at`,
      [id, data.name ?? null]
    );
    return rows[0] ? this.toCamel<Scenario>(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    // Prevent deleting the last/default scenario
    const { rows: check } = await this.query<{ cnt: string }>(
      `SELECT COUNT(*) AS cnt FROM scenarios WHERE is_default = true AND id = $1`,
      [id]
    );
    if (parseInt(check[0].cnt) > 0) {
      throw new Error('Cannot delete the default scenario');
    }
    const { rowCount } = await this.query(`DELETE FROM scenarios WHERE id = $1`, [id]);
    return (rowCount ?? 0) > 0;
  }

  async count(): Promise<number> {
    const { rows } = await this.query<{ cnt: string }>(`SELECT COUNT(*) AS cnt FROM scenarios`);
    return parseInt(rows[0].cnt);
  }
}
