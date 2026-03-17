import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, requireAdmin, requireOwner } from '../auth/middleware.js';
import { MembershipRepository } from '../repositories/MembershipRepository.js';
import { AuditRepository } from '../repositories/AuditRepository.js';
import { queryPublic } from '../db/pool.js';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER', 'BOARD']),
});

const updateRoleSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER', 'BOARD']),
});

export async function membershipRoutes(app: FastifyInstance) {
  // GET /team — list all members
  app.get('/team', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const repo = new MembershipRepository(request.ctx.tenantId);
    const memberships = await repo.findAll();

    // Enrich with user details
    const userIds = memberships
      .map(m => m.userId)
      .filter(id => id != null);

    const users: Record<string, { email: string; displayName?: string }> = {};
    if (userIds.length > 0) {
      const { rows } = await queryPublic<{ id: string; email: string; display_name?: string }>(
        `SELECT id, email, display_name FROM cairn_public.users WHERE id = ANY($1::uuid[])`,
        [userIds]
      );
      for (const u of rows) {
        users[u.id] = { email: u.email, displayName: u.display_name };
      }
    }

    return reply.send(
      memberships.map(m => ({
        ...m,
        email: users[m.userId]?.email ?? m.inviteEmail,
        displayName: users[m.userId]?.displayName,
      }))
    );
  });

  // POST /team/invite — invite a new member
  app.post(
    '/team/invite',
    { preHandler: [authenticate, requireAdmin] },
    async (request, reply) => {
      const data = inviteSchema.parse(request.body);
      const repo = new MembershipRepository(request.ctx.tenantId);

      const invite = await repo.createInvite({
        inviteEmail: data.email,
        role: data.role,
        invitedBy: request.ctx.userId,
      });

      await AuditRepository.log({
        tenantId: request.ctx.tenantId,
        userId: request.ctx.userId,
        action: 'team.invite',
        entityType: 'membership',
        entityId: invite.id,
        payload: { email: data.email, role: data.role },
        request,
      });

      // TODO: send invite email via transactional email service
      return reply.code(201).send({
        ...invite,
        inviteUrl: `${process.env.APP_URL}/invite/${invite.inviteToken}`,
      });
    }
  );

  // POST /team/accept-invite — accept a pending invite
  app.post(
    '/team/accept-invite',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { token } = z.object({ token: z.string() }).parse(request.body);
      const repo = new MembershipRepository(request.ctx.tenantId);
      const membership = await repo.acceptInvite(token, request.ctx.userId);
      if (!membership) {
        return reply.code(404).send({ error: 'Invalid or already-used invite token' });
      }
      return reply.send(membership);
    }
  );

  // PATCH /team/:userId/role — update a member's role
  app.patch<{ Params: { userId: string } }>(
    '/team/:userId/role',
    { preHandler: [authenticate, requireOwner] },
    async (request, reply) => {
      const data = updateRoleSchema.parse(request.body);
      const repo = new MembershipRepository(request.ctx.tenantId);
      const membership = await repo.updateRole(request.params.userId, data.role);
      if (!membership) return reply.code(404).send({ error: 'Member not found' });

      await AuditRepository.log({
        tenantId: request.ctx.tenantId,
        userId: request.ctx.userId,
        action: 'team.role_change',
        entityType: 'membership',
        entityId: request.params.userId,
        payload: { role: data.role },
        request,
      });

      return reply.send(membership);
    }
  );

  // DELETE /team/:userId — remove a member
  app.delete<{ Params: { userId: string } }>(
    '/team/:userId',
    { preHandler: [authenticate, requireAdmin] },
    async (request, reply) => {
      const repo = new MembershipRepository(request.ctx.tenantId);
      try {
        const removed = await repo.remove(request.params.userId);
        if (!removed) return reply.code(404).send({ error: 'Member not found' });
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('last owner')) {
          return reply.code(400).send({ error: err.message });
        }
        throw err;
      }

      await AuditRepository.log({
        tenantId: request.ctx.tenantId,
        userId: request.ctx.userId,
        action: 'team.remove',
        entityType: 'membership',
        entityId: request.params.userId,
        request,
      });

      return reply.code(204).send();
    }
  );

  // GET /auth/tenants — list tenants for the current user (multi-tenant login selector)
  app.get('/auth/tenants', { preHandler: [authenticate] }, async (request, reply) => {
    const tenants = await MembershipRepository.findTenantsForUser(request.ctx.userId);
    return reply.send(tenants);
  });
}
