import { BaseRepository } from './base.js';
import type { Snapshot } from '../types/index.js';

export class SnapshotRepository extends BaseRepository {
  async findByScenario(scenarioId: string): Promise<Snapshot[]> {
    const { rows } = await this.query<Record<string, unknown>>(
      `SELECT id, scenario_id, label, state, benchmarked, created_by, created_at
       FROM snapshots WHERE scenario_id = $1 ORDER BY created_at DESC`,
      [scenarioId]
    );
    return this.rowsToCamel<Snapshot>(rows);
  }

  async findById(id: string): Promise<Snapshot | null> {
    const { rows } = await this.query<Record<string, unknown>>(
      `SELECT id, scenario_id, label, state, benchmarked, created_by, created_at
       FROM snapshots WHERE id = $1`,
      [id]
    );
    return rows[0] ? this.toCamel<Snapshot>(rows[0]) : null;
  }

  async create(data: {
    scenarioId: string;
    label: string;
    state: Record<string, unknown>;
    createdBy?: string;
  }): Promise<Snapshot> {
    const { rows } = await this.query<Record<string, unknown>>(
      `INSERT INTO snapshots (id, scenario_id, label, state, created_by)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)
       RETURNING id, scenario_id, label, state, benchmarked, created_by, created_at`,
      [data.scenarioId, data.label, JSON.stringify(data.state), data.createdBy ?? null]
    );
    return this.toCamel<Snapshot>(rows[0]);
  }

  async markBenchmarked(id: string): Promise<void> {
    await this.query(
      `UPDATE snapshots SET benchmarked = true WHERE id = $1`,
      [id]
    );
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await this.query(`DELETE FROM snapshots WHERE id = $1`, [id]);
    return (rowCount ?? 0) > 0;
  }

  async countByScenario(scenarioId: string): Promise<number> {
    const { rows } = await this.query<{ cnt: string }>(
      `SELECT COUNT(*) AS cnt FROM snapshots WHERE scenario_id = $1`,
      [scenarioId]
    );
    return parseInt(rows[0].cnt);
  }
}
