import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { createTenant } from '../services/gdprDeletion.js';
import { MembershipRepository } from '../repositories/MembershipRepository.js';
import { queryPublic } from '../db/pool.js';

const supabaseAdmin = () => createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(200),
  orgName: z.string().min(1).max(200),
  orgSlug: z.string().regex(/^[a-z0-9-]{2,50}$/),
});

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/register — create new account + tenant
  app.post('/auth/register', async (request, reply) => {
    const data = registerSchema.parse(request.body);

    // Check slug availability
    const { rows: existing } = await queryPublic<{ id: string }>(
      `SELECT id FROM cairn_public.tenants WHERE slug = $1`,
      [data.orgSlug]
    );
    if (existing.length > 0) {
      return reply.code(409).send({ error: 'Organisation slug is already taken' });
    }

    // Create Supabase auth user
    const supabase = supabaseAdmin();
    const { data: authData, error } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { display_name: data.displayName },
    });

    if (error || !authData.user) {
      return reply.code(400).send({ error: error?.message ?? 'Failed to create user' });
    }

    const newUserId = authData.user.id;

    // Create tenant + owner membership. If this fails, the Supabase auth user
    // is already created and would otherwise become an orphan — best-effort
    // delete it so the caller can retry registration cleanly.
    let tenantId: string;
    try {
      ({ tenantId } = await createTenant({
        slug: data.orgSlug,
        displayName: data.orgName,
        ownerUserId: newUserId,
        ownerEmail: data.email,
      }));
    } catch (err) {
      try {
        await supabase.auth.admin.deleteUser(newUserId);
      } catch (cleanupErr) {
        request.log.error(
          { err: cleanupErr, userId: newUserId },
          'Failed to clean up Supabase user after tenant provisioning failure'
        );
      }
      throw err;
    }

    return reply.code(201).send({
      message: 'Account created successfully',
      userId: newUserId,
      tenantId,
    });
  });

  // GET /auth/tenants — list tenants accessible by the current user (pre-auth helper)
  // Used by the tenant selector on multi-tenant login
  app.get('/auth/tenants-for-email', async (request, reply) => {
    const { email } = z.object({ email: z.string().email() }).parse(request.query);

    const { rows } = await queryPublic<Record<string, unknown>>(
      `SELECT tm.tenant_id, t.slug, t.display_name, tm.role
       FROM cairn_public.tenant_memberships tm
       JOIN cairn_public.tenants t ON t.id = tm.tenant_id
       JOIN cairn_public.users u ON u.id = tm.user_id
       WHERE u.email = $1 AND tm.accepted_at IS NOT NULL
         AND t.deletion_scheduled_at IS NULL`,
      [email]
    );

    return reply.send(rows);
  });
}
