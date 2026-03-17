import { BaseRepository } from './base.js';
import type { Effect } from '../types/index.js';

export class EffectRepository extends BaseRepository {
  async findByScenario(scenarioId: string): Promise<Effect[]> {
    const { rows } = await this.query<Record<string, unknown>>(
      `SELECT id, scenario_id, name, description, initiatives, sort_order, created_at, updated_at
       FROM effects WHERE scenario_id = $1 ORDER BY sort_order ASC, created_at ASC`,
      [scenarioId]
    );
    return this.rowsToCamel<Effect>(rows);
  }

  async findById(id: string): Promise<Effect | null> {
    const { rows } = await this.query<Record<string, unknown>>(
      `SELECT id, scenario_id, name, description, initiatives, sort_order, created_at, updated_at
       FROM effects WHERE id = $1`,
      [id]
    );
    return rows[0] ? this.toCamel<Effect>(rows[0]) : null;
  }

  async create(data: { scenarioId: string; name: string; description?: string; initiatives?: string[] }): Promise<Effect> {
    const { rows } = await this.query<Record<string, unknown>>(
      `INSERT INTO effects (id, scenario_id, name, description, initiatives)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)
       RETURNING id, scenario_id, name, description, initiatives, sort_order, created_at, updated_at`,
      [data.scenarioId, data.name, data.description ?? null, data.initiatives ?? []]
    );
    return this.toCamel<Effect>(rows[0]);
  }

  async update(id: string, data: { name?: string; description?: string; initiatives?: string[] }): Promise<Effect | null> {
    const { rows } = await this.query<Record<string, unknown>>(
      `UPDATE effects
       SET name = COALESCE($2, name),
           description = COALESCE($3, description),
           initiatives = COALESCE($4, initiatives)
       WHERE id = $1
       RETURNING id, scenario_id, name, description, initiatives, sort_order, created_at, updated_at`,
      [id, data.name ?? null, data.description ?? null, data.initiatives ?? null]
    );
    return rows[0] ? this.toCamel<Effect>(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await this.query(`DELETE FROM effects WHERE id = $1`, [id]);
    return (rowCount ?? 0) > 0;
  }
}
