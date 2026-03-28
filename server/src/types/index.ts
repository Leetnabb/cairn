// ============================================================
// Backend type definitions for Cairn multi-tenant API
// ============================================================

export type PlanTier = 'FREE' | 'PRO' | 'ENTERPRISE';
export type TenantRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER' | 'BOARD';
export type ConfidenceLevel = 'confirmed' | 'tentative' | 'under_consideration';
export type Horizon = 'near' | 'mid' | 'far';
export type InitiativeStatus = 'not_started' | 'in_progress' | 'done' | 'blocked';

// ── JWT payload ──────────────────────────────────────────
export interface JWTPayload {
  sub: string;          // user_id (UUID)
  email: string;
  tenant_id: string;    // resolved tenant — ONLY source for tenant isolation
  role: TenantRole;
  plan: PlanTier;
  iat: number;
  exp: number;
}

// ── Tenant ───────────────────────────────────────────────
export interface Tenant {
  id: string;
  slug: string;
  displayName: string;
  plan: PlanTier;
  schemaName: string;
  sector?: string;
  orgSizeband?: string;
  deletionRequestedAt?: Date;
  deletionScheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── User ─────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Membership ───────────────────────────────────────────
export interface TenantMembership {
  id: string;
  tenantId: string;
  userId: string;
  role: TenantRole;
  invitedBy?: string;
  inviteToken?: string;
  inviteEmail?: string;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── Plan limits ──────────────────────────────────────────
export interface PlanLimits {
  maxScenarios: number | null;
  maxInitiatives: number | null;
  capabilitiesModule: boolean;
  effectsModule: boolean;
  benchmarkAccess: boolean;
  auditLogAccess: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  FREE: {
    maxScenarios: 1,
    maxInitiatives: 20,
    capabilitiesModule: false,
    effectsModule: false,
    benchmarkAccess: false,
    auditLogAccess: false,
  },
  PRO: {
    maxScenarios: 10,
    maxInitiatives: null,
    capabilitiesModule: true,
    effectsModule: true,
    benchmarkAccess: false,
    auditLogAccess: false,
  },
  ENTERPRISE: {
    maxScenarios: null,
    maxInitiatives: null,
    capabilitiesModule: true,
    effectsModule: true,
    benchmarkAccess: true,
    auditLogAccess: true,
  },
};

// ── Scenario ─────────────────────────────────────────────
export interface Scenario {
  id: string;
  strategyId?: string;
  name: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Capability ───────────────────────────────────────────
export interface Capability {
  id: string;
  scenarioId: string;
  name: string;
  description?: string;
  maturity: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── Milestone ────────────────────────────────────────────
export interface Milestone {
  id: string;
  scenarioId: string;
  label: string;
  date?: Date;
  createdAt: Date;
}

// ── Initiative ───────────────────────────────────────────
export interface Initiative {
  id: string;
  scenarioId: string;
  name: string;
  description?: string;
  horizon: Horizon;
  dimension: string;
  status: InitiativeStatus;
  confidence: ConfidenceLevel;
  owner?: string;
  milestoneId?: string;
  dependsOn: string[];
  capabilities: string[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── Effect ───────────────────────────────────────────────
export interface Effect {
  id: string;
  scenarioId: string;
  name: string;
  description?: string;
  initiatives: string[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── Snapshot ─────────────────────────────────────────────
export interface Snapshot {
  id: string;
  scenarioId: string;
  label: string;
  state: Record<string, unknown>;
  benchmarked: boolean;
  createdBy?: string;
  createdAt: Date;
}

// ── Benchmark vector ─────────────────────────────────────
export interface BenchmarkVector {
  id: string;
  tenantHash: string;
  snapshotHash: string;
  initiativeCount: number;
  capabilityCount: number;
  effectCount: number;
  nearHorizonPct: number;
  farHorizonPct: number;
  confirmedPct: number;
  tentativePct: number;
  underConsiderationPct: number;
  dimensionGini: number;
  capabilityCoverage?: number;
  effectLinkage?: number;
  criticalPathLength?: number;
  initiativesPerDimension?: Record<string, number>;
  avgCapabilityMaturity?: number;
  avgCapabilityRisk?: number;
  capabilitiesWithNoInitiatives?: number;
  effectsWithNoInitiatives?: number;
  initiativesWithNoEffects?: number;
  maxOwnerLoad?: number;
  scenarioCount?: number;
  effectTypeDistribution?: Record<string, number>;
  sector?: string;
  orgSizeband?: string;
  planTier: PlanTier;
  createdAt: Date;
}

// ── Benchmark query results ───────────────────────────────
export interface BenchmarkPercentile {
  metric: string;
  value: number;
  percentile: number;   // 0-100, where the tenant sits vs. pool
  sampleSize: number;
}

export interface BenchmarkDistribution {
  metric: string;
  p25: number;
  p50: number;
  p75: number;
  mean: number;
  sampleSize: number;
}

export interface BenchmarkCorrelation {
  metricA: string;
  metricB: string;
  correlation: number;
  sampleSize: number;
}

export const BENCHMARK_MIN_SAMPLE = 10;

// ── Audit event ──────────────────────────────────────────
export interface AuditEvent {
  id: string;
  tenantId: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// ── API request context ──────────────────────────────────
export interface RequestContext {
  userId: string;
  tenantId: string;
  role: TenantRole;
  plan: PlanTier;
  schemaName: string;
}
