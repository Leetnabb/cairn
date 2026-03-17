import { BaseRepository } from './base.js';
import type { Capability } from '../types/index.js';

export class CapabilityRepository extends BaseRepository {
  async findByScenario(scenarioId: string): Promise<Capability[]> {
    const { rows } = await this.query<Record<string, unknown>>(
      `SELECT id, scenario_id, name, description, maturity, created_at, updated_at
       FROM capabilities WHERE scenario_id = $1 ORDER BY name ASC`,
      [scenarioId]
    );
    return this.rowsToCamel<Capability>(rows);
  }

  async findById(id: string): Promise<Capability | null> {
    const { rows } = await this.query<Record<string, unknown>>(
      `SELECT id, scenario_id, name, description, maturity, created_at, updated_at
       FROM capabilities WHERE id = $1`,
      [id]
    );
    return rows[0] ? this.toCamel<Capability>(rows[0]) : null;
  }

  async create(data: { scenarioId: string; name: string; description?: string; maturity?: number }): Promise<Capability> {
    const { rows } = await this.query<Record<string, unknown>>(
      `INSERT INTO capabilities (id, scenario_id, name, description, maturity)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)
       RETURNING id, scenario_id, name, description, maturity, created_at, updated_at`,
      [data.scenarioId, data.name, data.description ?? null, data.maturity ?? 1]
    );
    return this.toCamel<Capability>(rows[0]);
  }

  async update(id: string, data: { name?: string; description?: string; maturity?: number }): Promise<Capability | null> {
    const { rows } = await this.query<Record<string, unknown>>(
      `UPDATE capabilities
       SET name = COALESCE($2, name),
           description = COALESCE($3, description),
           maturity = COALESCE($4, maturity)
       WHERE id = $1
       RETURNING id, scenario_id, name, description, maturity, created_at, updated_at`,
      [id, data.name ?? null, data.description ?? null, data.maturity ?? null]
    );
    return rows[0] ? this.toCamel<Capability>(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    // Remove from initiatives' capabilities arrays
    await this.query(
      `UPDATE initiatives SET capabilities = array_remove(capabilities, $1::uuid)
       WHERE $1::uuid = ANY(capabilities)`,
      [id]
    );
    const { rowCount } = await this.query(`DELETE FROM capabilities WHERE id = $1`, [id]);
    return (rowCount ?? 0) > 0;
  }
}
