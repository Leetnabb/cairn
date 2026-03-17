import { queryPublic } from '../db/pool.js';
import { dropTenantSchema } from '../db/provision.js';
import { BenchmarkRepository } from '../repositories/BenchmarkRepository.js';
import { AuditRepository } from '../repositories/AuditRepository.js';

/**
 * Execute GDPR deletion cascade for tenants past their 30-day grace period.
 * Intended to be run as a scheduled job (e.g. daily cron).
 *
 * Cascade order:
 * 1. Drop tenant schema (all data: initiatives, caps, effects, snapshots, etc.)
 * 2. Delete tenant memberships from cairn_public
 * 3. Anonymise benchmark vectors (preserve aggregate utility, remove identity)
 * 4. Delete encryption key reference
 * 5. Delete tenant record from cairn_public
 */
export async function executePendingDeletions(): Promise<void> {
  const { rows: pendingTenants } = await queryPublic<{
    id: string;
    schema_name: string;
    display_name: string;
    deletion_scheduled_at: string;
  }>(
    `SELECT id, schema_name, display_name, deletion_scheduled_at
     FROM cairn_public.tenants
     WHERE deletion_scheduled_at IS NOT NULL
       AND deletion_scheduled_at <= NOW()
     LIMIT 10`  // Process in batches
  );

  for (const tenant of pendingTenants) {
    console.log(`[gdpr] Starting deletion for tenant ${tenant.id} (${tenant.display_name})`);

    try {
      // 1. Drop tenant schema
      await dropTenantSchema(tenant.schema_name);

      // 2. Delete memberships
      await queryPublic(
        `DELETE FROM cairn_public.tenant_memberships WHERE tenant_id = $1`,
        [tenant.id]
      );

      // 3. Anonymise benchmark vectors
      const benchRepo = new BenchmarkRepository();
      await benchRepo.anonymiseTenant(tenant.id);

      // 4. Clear encryption key reference
      await queryPublic(
        `UPDATE cairn_public.tenants SET enc_key_hash = NULL WHERE id = $1`,
        [tenant.id]
      );

      // 5. Delete audit events (retain for 90 days after deletion)
      // Note: audit events are NOT deleted immediately — they have their own retention
      // Tenant record deletion will cascade via FK in production setup

      // 5. Delete tenant record
      await queryPublic(`DELETE FROM cairn_public.tenants WHERE id = $1`, [tenant.id]);

      console.log(`[gdpr] Deletion complete for tenant ${tenant.id}`);
    } catch (err) {
      console.error(`[gdpr] Failed to delete tenant ${tenant.id}:`, err);
      // Continue with next tenant — don't abort the entire batch
    }
  }
}

/**
 * Provision a new tenant in the database.
 * Returns the new tenant record.
 */
export async function createTenant(data: {
  slug: string;
  displayName: string;
  ownerUserId: string;
  ownerEmail: string;
}): Promise<{ tenantId: string; schemaName: string }> {
  const tenantId = crypto.randomUUID();
  const schemaName = `tenant_${tenantId.replace(/-/g, '')}`;

  // Insert tenant record
  await queryPublic(
    `INSERT INTO cairn_public.tenants (id, slug, display_name, schema_name, plan)
     VALUES ($1, $2, $3, $4, 'FREE')`,
    [tenantId, data.slug, data.displayName, schemaName]
  );

  // Upsert user record
  await queryPublic(
    `INSERT INTO cairn_public.users (id, email)
     VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
    [data.ownerUserId, data.ownerEmail]
  );

  // Add owner membership
  await queryPublic(
    `INSERT INTO cairn_public.tenant_memberships (id, tenant_id, user_id, role, accepted_at)
     VALUES (gen_random_uuid(), $1, $2, 'OWNER', NOW())`,
    [tenantId, data.ownerUserId]
  );

  // Provision tenant schema
  const { provisionTenantSchema } = await import('../db/provision.js');
  await provisionTenantSchema(schemaName, tenantId);

  await AuditRepository.log({
    tenantId,
    userId: data.ownerUserId,
    action: 'tenant.create',
    payload: { slug: data.slug, displayName: data.displayName },
  });

  return { tenantId, schemaName };
}
