import { BaseRepository } from './base.js';
import type { Initiative, ConfidenceLevel, Horizon, InitiativeStatus } from '../types/index.js';

interface CreateInitiativeData {
  scenarioId: string;
  name: string;
  description?: string;
  horizon?: Horizon;
  dimension?: string;
  status?: InitiativeStatus;
  confidence?: ConfidenceLevel;
  owner?: string;
  milestoneId?: string;
  dependsOn?: string[];
  capabilities?: string[];
  sortOrder?: number;
}

interface UpdateInitiativeData extends Partial<Omit<CreateInitiativeData, 'scenarioId'>> {}

export class InitiativeRepository extends BaseRepository {
  async findByScenario(scenarioId: string): Promise<Initiative[]> {
    const { rows } = await this.query<Record<string, unknown>>(
      `SELECT id, scenario_id, name, description, horizon, dimension, status,
              confidence, owner, milestone_id, depends_on, capabilities, sort_order,
              created_at, updated_at
       FROM initiatives WHERE scenario_id = $1
       ORDER BY sort_order ASC, created_at ASC`,
      [scenarioId]
    );
    return this.rowsToCamel<Initiative>(rows);
  }

  async findById(id: string): Promise<Initiative | null> {
    const { rows } = await this.query<Record<string, unknown>>(
      `SELECT id, scenario_id, name, description, horizon, dimension, status,
              confidence, owner, milestone_id, depends_on, capabilities, sort_order,
              created_at, updated_at
       FROM initiatives WHERE id = $1`,
      [id]
    );
    return rows[0] ? this.toCamel<Initiative>(rows[0]) : null;
  }

  async create(data: CreateInitiativeData): Promise<Initiative> {
    const { rows } = await this.query<Record<string, unknown>>(
      `INSERT INTO initiatives (
         id, scenario_id, name, description, horizon, dimension, status,
         confidence, owner, milestone_id, depends_on, capabilities, sort_order
       ) VALUES (
         gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
       ) RETURNING id, scenario_id, name, description, horizon, dimension, status,
                   confidence, owner, milestone_id, depends_on, capabilities,
                   sort_order, created_at, updated_at`,
      [
        data.scenarioId,
        data.name,
        data.description ?? null,
        data.horizon ?? 'near',
        data.dimension ?? 'people',
        data.status ?? 'not_started',
        data.confidence ?? 'confirmed',
        data.owner ?? null,
        data.milestoneId ?? null,
        data.dependsOn ?? [],
        data.capabilities ?? [],
        data.sortOrder ?? 0,
      ]
    );
    return this.toCamel<Initiative>(rows[0]);
  }

  async update(id: string, data: UpdateInitiativeData): Promise<Initiative | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [id];
    let i = 2;

    const fieldMap: Record<keyof UpdateInitiativeData, string> = {
      name: 'name',
      description: 'description',
      horizon: 'horizon',
      dimension: 'dimension',
      status: 'status',
      confidence: 'confidence',
      owner: 'owner',
      milestoneId: 'milestone_id',
      dependsOn: 'depends_on',
      capabilities: 'capabilities',
      sortOrder: 'sort_order',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      const val = data[key as keyof UpdateInitiativeData];
      if (val !== undefined) {
        setClauses.push(`${col} = $${i++}`);
        values.push(val);
      }
    }

    if (setClauses.length === 0) return this.findById(id);

    const { rows } = await this.query<Record<string, unknown>>(
      `UPDATE initiatives SET ${setClauses.join(', ')}
       WHERE id = $1
       RETURNING id, scenario_id, name, description, horizon, dimension, status,
                 confidence, owner, milestone_id, depends_on, capabilities,
                 sort_order, created_at, updated_at`,
      values
    );
    return rows[0] ? this.toCamel<Initiative>(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    // Remove from other initiatives' depends_on arrays
    await this.query(
      `UPDATE initiatives SET depends_on = array_remove(depends_on, $1::uuid)
       WHERE $1::uuid = ANY(depends_on)`,
      [id]
    );
    // Remove from effects' initiatives arrays
    await this.query(
      `UPDATE effects SET initiatives = array_remove(initiatives, $1::uuid)
       WHERE $1::uuid = ANY(initiatives)`,
      [id]
    );
    const { rowCount } = await this.query(`DELETE FROM initiatives WHERE id = $1`, [id]);
    return (rowCount ?? 0) > 0;
  }

  async countByScenario(scenarioId: string): Promise<number> {
    const { rows } = await this.query<{ cnt: string }>(
      `SELECT COUNT(*) AS cnt FROM initiatives WHERE scenario_id = $1`,
      [scenarioId]
    );
    return parseInt(rows[0].cnt);
  }
}
