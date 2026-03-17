import { queryPublic } from '../db/pool.js';
import type { TenantMembership, TenantRole } from '../types/index.js';

/**
 * Membership repository operates on cairn_public schema (not tenant-specific).
 * Does not extend BaseRepository since it uses queryPublic.
 */
export class MembershipRepository {
  private readonly tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  private toCamel(row: Record<string, unknown>): TenantMembership {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      userId: row.user_id as string,
      role: row.role as TenantRole,
      invitedBy: row.invited_by as string | undefined,
      inviteToken: row.invite_token as string | undefined,
      inviteEmail: row.invite_email as string | undefined,
      acceptedAt: row.accepted_at ? new Date(row.accepted_at as string) : undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  async findAll(): Promise<TenantMembership[]> {
    const { rows } = await queryPublic<Record<string, unknown>>(
      `SELECT id, tenant_id, user_id, role, invited_by, invite_token, invite_email,
              accepted_at, created_at, updated_at
       FROM cairn_public.tenant_memberships WHERE tenant_id = $1`,
      [this.tenantId]
    );
    return rows.map(r => this.toCamel(r));
  }

  async findByUserId(userId: string): Promise<TenantMembership | null> {
    const { rows } = await queryPublic<Record<string, unknown>>(
      `SELECT id, tenant_id, user_id, role, invited_by, invite_token, invite_email,
              accepted_at, created_at, updated_at
       FROM cairn_public.tenant_memberships
       WHERE tenant_id = $1 AND user_id = $2`,
      [this.tenantId, userId]
    );
    return rows[0] ? this.toCamel(rows[0]) : null;
  }

  async findByInviteToken(token: string): Promise<TenantMembership | null> {
    const { rows } = await queryPublic<Record<string, unknown>>(
      `SELECT id, tenant_id, user_id, role, invited_by, invite_token, invite_email,
              accepted_at, created_at, updated_at
       FROM cairn_public.tenant_memberships
       WHERE invite_token = $1`,
      [token]
    );
    return rows[0] ? this.toCamel(rows[0]) : null;
  }

  async createInvite(data: {
    inviteEmail: string;
    role: TenantRole;
    invitedBy: string;
  }): Promise<TenantMembership> {
    const token = crypto.randomUUID();
    const { rows } = await queryPublic<Record<string, unknown>>(
      `INSERT INTO cairn_public.tenant_memberships
         (id, tenant_id, user_id, role, invited_by, invite_token, invite_email)
       VALUES (gen_random_uuid(), $1, gen_random_uuid(), $2, $3, $4, $5)
       RETURNING id, tenant_id, user_id, role, invited_by, invite_token,
                 invite_email, accepted_at, created_at, updated_at`,
      [this.tenantId, data.role, data.invitedBy, token, data.inviteEmail]
    );
    return this.toCamel(rows[0]);
  }

  async acceptInvite(token: string, userId: string): Promise<TenantMembership | null> {
    const { rows } = await queryPublic<Record<string, unknown>>(
      `UPDATE cairn_public.tenant_memberships
       SET user_id = $2, invite_token = NULL, accepted_at = NOW()
       WHERE invite_token = $1 AND tenant_id = $3
       RETURNING id, tenant_id, user_id, role, invited_by, invite_token,
                 invite_email, accepted_at, created_at, updated_at`,
      [token, userId, this.tenantId]
    );
    return rows[0] ? this.toCamel(rows[0]) : null;
  }

  async updateRole(userId: string, role: TenantRole): Promise<TenantMembership | null> {
    const { rows } = await queryPublic<Record<string, unknown>>(
      `UPDATE cairn_public.tenant_memberships SET role = $3
       WHERE tenant_id = $1 AND user_id = $2
       RETURNING id, tenant_id, user_id, role, invited_by, invite_token,
                 invite_email, accepted_at, created_at, updated_at`,
      [this.tenantId, userId, role]
    );
    return rows[0] ? this.toCamel(rows[0]) : null;
  }

  async remove(userId: string): Promise<boolean> {
    // Prevent removing the last OWNER
    const { rows: owners } = await queryPublic<{ cnt: string }>(
      `SELECT COUNT(*) AS cnt FROM cairn_public.tenant_memberships
       WHERE tenant_id = $1 AND role = 'OWNER'`,
      [this.tenantId]
    );
    const ownerCount = parseInt(owners[0].cnt);

    const { rows: target } = await queryPublic<{ role: string }>(
      `SELECT role FROM cairn_public.tenant_memberships WHERE tenant_id = $1 AND user_id = $2`,
      [this.tenantId, userId]
    );
    if (target[0]?.role === 'OWNER' && ownerCount <= 1) {
      throw new Error('Cannot remove the last owner from a tenant');
    }

    const { rowCount } = await queryPublic(
      `DELETE FROM cairn_public.tenant_memberships WHERE tenant_id = $1 AND user_id = $2`,
      [this.tenantId, userId]
    );
    return (rowCount ?? 0) > 0;
  }

  /** Find all tenants a user belongs to (for multi-tenant login selector) */
  static async findTenantsForUser(userId: string): Promise<Array<{
    tenantId: string;
    tenantSlug: string;
    displayName: string;
    role: TenantRole;
  }>> {
    const { rows } = await queryPublic<Record<string, unknown>>(
      `SELECT tm.tenant_id, t.slug AS tenant_slug, t.display_name, tm.role
       FROM cairn_public.tenant_memberships tm
       JOIN cairn_public.tenants t ON t.id = tm.tenant_id
       WHERE tm.user_id = $1 AND tm.accepted_at IS NOT NULL
         AND t.deletion_scheduled_at IS NULL
       ORDER BY t.display_name ASC`,
      [userId]
    );
    return rows.map(r => ({
      tenantId: r.tenant_id as string,
      tenantSlug: r.tenant_slug as string,
      displayName: r.display_name as string,
      role: r.role as TenantRole,
    }));
  }
}
