-- ============================================================
-- cairn_public schema — shared across all tenants
-- Run once on database initialisation
-- ============================================================

CREATE SCHEMA IF NOT EXISTS cairn_public;

SET search_path = cairn_public;

-- ── Plan tiers ────────────────────────────────────────────
CREATE TYPE plan_tier AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- ── Tenant role ───────────────────────────────────────────
CREATE TYPE tenant_role AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER', 'BOARD');

-- ── Tenants ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,          -- e.g. "acme-corp"
  display_name  TEXT NOT NULL,
  plan          plan_tier NOT NULL DEFAULT 'FREE',
  schema_name   TEXT NOT NULL UNIQUE,          -- e.g. "tenant_550e8400..."
  -- Application-level encryption key (KDF-derived, base64-encoded)
  enc_key_hash  TEXT,                          -- stored hash only; actual key in vault/env
  -- Opt-in metadata for benchmark filtering
  sector        TEXT,                          -- 'public' | 'finance' | 'energy' | 'telecom' | null
  org_sizeband  TEXT,                          -- 'small' | 'medium' | 'large' | null
  -- GDPR deletion grace period
  deletion_requested_at TIMESTAMPTZ,
  deletion_scheduled_at TIMESTAMPTZ,          -- deletion_requested_at + 30 days
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tenants_slug_idx ON tenants(slug);

-- ── Users ────────────────────────────────────────────────
-- Mirrors Supabase auth.users; populated on first login via trigger/webhook
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY,              -- matches auth.users.id
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tenant memberships ────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_memberships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role          tenant_role NOT NULL DEFAULT 'VIEWER',
  invited_by    UUID REFERENCES users(id),
  invite_token  TEXT UNIQUE,                   -- NULL once accepted
  invite_email  TEXT,                          -- pre-acceptance email target
  accepted_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS memberships_tenant_idx ON tenant_memberships(tenant_id);
CREATE INDEX IF NOT EXISTS memberships_user_idx ON tenant_memberships(user_id);
CREATE INDEX IF NOT EXISTS memberships_invite_token_idx ON tenant_memberships(invite_token)
  WHERE invite_token IS NOT NULL;

-- ── Benchmark vectors ────────────────────────────────────
-- Pure, text-free structural signals extracted at snapshot save time
CREATE TABLE IF NOT EXISTS benchmark_vectors (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Anonymised identifiers (tenant/snapshot IDs are hashed before insertion)
  tenant_hash           TEXT NOT NULL,         -- SHA-256 of tenant_id + salt
  snapshot_hash         TEXT NOT NULL UNIQUE,  -- SHA-256 of snapshot_id + salt
  -- Structural signals
  initiative_count      INTEGER NOT NULL,
  capability_count      INTEGER NOT NULL DEFAULT 0,
  effect_count          INTEGER NOT NULL DEFAULT 0,
  near_horizon_pct      NUMERIC(5,2) NOT NULL, -- 0-100
  far_horizon_pct       NUMERIC(5,2) NOT NULL,
  confirmed_pct         NUMERIC(5,2) NOT NULL,
  tentative_pct         NUMERIC(5,2) NOT NULL,
  under_consideration_pct NUMERIC(5,2) NOT NULL,
  dimension_gini        NUMERIC(6,4) NOT NULL, -- concentration index 0-1 (dimensionImbalanceScore)
  capability_coverage   NUMERIC(5,2),          -- % of capabilities with ≥1 initiative
  effect_linkage        NUMERIC(5,2),          -- % of effects with ≥1 initiative
  critical_path_length  INTEGER,
  -- Enriched signals (Layer 4 spec)
  initiatives_per_dimension JSONB,             -- {leadership, business, organisation, technology}
  avg_capability_maturity   NUMERIC(4,2),      -- 1.0–5.0
  avg_capability_risk       NUMERIC(4,2),      -- 1.0–3.0 (when available)
  capabilities_with_no_initiatives INTEGER,
  effects_with_no_initiatives    INTEGER,
  initiatives_with_no_effects    INTEGER,
  max_owner_load        INTEGER,               -- highest initiative count per owner
  scenario_count        INTEGER,
  effect_type_distribution JSONB,              -- {cost, quality, speed, compliance, strategic}
  -- Opt-in metadata (provided by tenant, not derived)
  sector                TEXT,                  -- 'public' | 'finance' | 'energy' | 'telecom' | null
  org_sizeband          TEXT,                  -- 'small' | 'medium' | 'large' | null
  plan_tier             plan_tier NOT NULL,     -- tier at time of snapshot
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bv_initiative_count_idx ON benchmark_vectors(initiative_count);
CREATE INDEX IF NOT EXISTS bv_plan_tier_idx ON benchmark_vectors(plan_tier);
CREATE INDEX IF NOT EXISTS bv_tenant_hash_idx ON benchmark_vectors(tenant_hash);
CREATE INDEX IF NOT EXISTS bv_sector_idx ON benchmark_vectors(sector) WHERE sector IS NOT NULL;
CREATE INDEX IF NOT EXISTS bv_org_sizeband_idx ON benchmark_vectors(org_sizeband) WHERE org_sizeband IS NOT NULL;

-- Minimum sample size enforced in query layer (not DB constraint)
-- See: getBenchmarkPercentile(), getBenchmarkDistribution()

-- ── Audit events ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,                 -- e.g. "initiative.create"
  entity_type   TEXT,                          -- e.g. "initiative"
  entity_id     TEXT,
  payload       JSONB,                         -- sanitised diff / metadata
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immutable: no UPDATE or DELETE on audit_events
-- Enforced at application layer (repository has no update/delete methods)
CREATE INDEX IF NOT EXISTS audit_tenant_idx ON audit_events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_user_idx ON audit_events(user_id);

-- ── Plan limits view ─────────────────────────────────────
-- Convenience: join tenant plan with known limits
CREATE VIEW IF NOT EXISTS tenant_plan_limits AS
SELECT
  t.id AS tenant_id,
  t.plan,
  CASE t.plan
    WHEN 'FREE'       THEN 1
    WHEN 'PRO'        THEN 10
    WHEN 'ENTERPRISE' THEN NULL  -- unlimited
  END AS max_scenarios,
  CASE t.plan
    WHEN 'FREE'       THEN 20
    WHEN 'PRO'        THEN NULL
    WHEN 'ENTERPRISE' THEN NULL
  END AS max_initiatives,
  CASE t.plan
    WHEN 'FREE'       THEN false
    WHEN 'PRO'        THEN true
    WHEN 'ENTERPRISE' THEN true
  END AS capabilities_module,
  CASE t.plan
    WHEN 'FREE'       THEN false
    WHEN 'PRO'        THEN true
    WHEN 'ENTERPRISE' THEN true
  END AS effects_module,
  CASE t.plan
    WHEN 'FREE'       THEN false
    WHEN 'PRO'        THEN false
    WHEN 'ENTERPRISE' THEN true
  END AS benchmark_access,
  CASE t.plan
    WHEN 'FREE'       THEN false
    WHEN 'PRO'        THEN false
    WHEN 'ENTERPRISE' THEN true
  END AS audit_log_access
FROM tenants t;

-- ── Helper function: updated_at trigger ──────────────────
CREATE OR REPLACE FUNCTION cairn_public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION cairn_public.set_updated_at();

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION cairn_public.set_updated_at();

CREATE TRIGGER memberships_updated_at
  BEFORE UPDATE ON tenant_memberships
  FOR EACH ROW EXECUTE FUNCTION cairn_public.set_updated_at();
