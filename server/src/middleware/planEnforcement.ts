import { FastifyRequest, FastifyReply } from 'fastify';
import { PLAN_LIMITS } from '../types/index.js';
import { ScenarioRepository } from '../repositories/ScenarioRepository.js';
import { InitiativeRepository } from '../repositories/InitiativeRepository.js';

/**
 * Check scenario limit before creating a new scenario.
 */
export async function enforceScenarioLimit(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { plan, schemaName, tenantId } = request.ctx;
  const limits = PLAN_LIMITS[plan];

  if (limits.maxScenarios === null) return; // unlimited

  const repo = new ScenarioRepository(schemaName, tenantId);
  const count = await repo.count();

  if (count >= limits.maxScenarios) {
    return reply.code(403).send({
      error: `Your ${plan} plan allows a maximum of ${limits.maxScenarios} scenario(s). Upgrade to add more.`,
      code: 'PLAN_LIMIT_SCENARIOS',
      limit: limits.maxScenarios,
      current: count,
    });
  }
}

/**
 * Check initiative limit before creating a new initiative.
 * Scoped to the scenario specified in the request params.
 */
export async function enforceInitiativeLimit(
  request: FastifyRequest<{ Params: { scenarioId: string } }>,
  reply: FastifyReply
): Promise<void> {
  const { plan, schemaName, tenantId } = request.ctx;
  const limits = PLAN_LIMITS[plan];

  if (limits.maxInitiatives === null) return; // unlimited

  const repo = new InitiativeRepository(schemaName, tenantId);
  const count = await repo.countByScenario(request.params.scenarioId);

  if (count >= limits.maxInitiatives) {
    return reply.code(403).send({
      error: `Your ${plan} plan allows a maximum of ${limits.maxInitiatives} initiative(s) per scenario. Upgrade to add more.`,
      code: 'PLAN_LIMIT_INITIATIVES',
      limit: limits.maxInitiatives,
      current: count,
    });
  }
}

/**
 * Gate routes that require the capabilities module.
 */
export async function requireCapabilitiesModule(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const limits = PLAN_LIMITS[request.ctx.plan];
  if (!limits.capabilitiesModule) {
    return reply.code(403).send({
      error: 'Capabilities module requires PRO or ENTERPRISE plan.',
      code: 'PLAN_LIMIT_CAPABILITIES',
    });
  }
}

/**
 * Gate routes that require the effects module.
 */
export async function requireEffectsModule(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const limits = PLAN_LIMITS[request.ctx.plan];
  if (!limits.effectsModule) {
    return reply.code(403).send({
      error: 'Effects module requires PRO or ENTERPRISE plan.',
      code: 'PLAN_LIMIT_EFFECTS',
    });
  }
}

/**
 * Gate routes that require benchmark access.
 */
export async function requireBenchmarkAccess(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const limits = PLAN_LIMITS[request.ctx.plan];
  if (!limits.benchmarkAccess) {
    return reply.code(403).send({
      error: 'Benchmark access requires ENTERPRISE plan.',
      code: 'PLAN_LIMIT_BENCHMARK',
    });
  }
}

/**
 * Gate routes that require audit log access.
 */
export async function requireAuditLogAccess(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const limits = PLAN_LIMITS[request.ctx.plan];
  if (!limits.auditLogAccess) {
    return reply.code(403).send({
      error: 'Audit log access requires ENTERPRISE plan.',
      code: 'PLAN_LIMIT_AUDIT',
    });
  }
}
