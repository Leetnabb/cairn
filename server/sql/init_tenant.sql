-- ============================================================
-- Tenant schema template — executed once per new tenant
-- Replace {{SCHEMA}} with e.g. "tenant_550e8400e29b41d4a716446655440000"
-- ============================================================

-- NB: called with search_path already set to the tenant schema by the API
-- before running this script.

-- ── Enums (local to each tenant schema) ──────────────────
CREATE TYPE initiative_status AS ENUM (
  'not_started', 'in_progress', 'done', 'blocked'
);

CREATE TYPE confidence_level AS ENUM (
  'confirmed', 'tentative', 'under_consideration'
);

CREATE TYPE horizon AS ENUM ('near', 'far');

CREATE TYPE capability_maturity AS ENUM ('1', '2', '3', '4', '5');

-- ── Strategies ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS strategies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL DEFAULT 'Default Strategy',
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Scenarios ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scenarios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scenarios_strategy_idx ON scenarios(strategy_id);

-- ── Capabilities ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS capabilities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  maturity    SMALLINT NOT NULL DEFAULT 1 CHECK (maturity BETWEEN 1 AND 5),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS capabilities_scenario_idx ON capabilities(scenario_id);

-- ── Milestones ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS milestones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  date        DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS milestones_scenario_idx ON milestones(scenario_id);

-- ── Initiatives ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS initiatives (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id    UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  horizon        horizon NOT NULL DEFAULT 'near',
  dimension      TEXT NOT NULL DEFAULT 'people',
  status         initiative_status NOT NULL DEFAULT 'not_started',
  confidence     confidence_level NOT NULL DEFAULT 'confirmed',
  owner          TEXT,
  milestone_id   UUID REFERENCES milestones(id) ON DELETE SET NULL,
  -- Dependencies stored as array of initiative IDs
  depends_on     UUID[] NOT NULL DEFAULT '{}',
  -- Linked capability IDs
  capabilities   UUID[] NOT NULL DEFAULT '{}',
  -- Ordering
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS initiatives_scenario_idx ON initiatives(scenario_id);
CREATE INDEX IF NOT EXISTS initiatives_horizon_idx ON initiatives(scenario_id, horizon);

-- ── Effects ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS effects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id  UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  -- Linked initiative IDs
  initiatives  UUID[] NOT NULL DEFAULT '{}',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS effects_scenario_idx ON effects(scenario_id);

-- ── Value chains ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS value_chains (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  nodes       JSONB NOT NULL DEFAULT '[]',
  edges       JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS value_chains_scenario_idx ON value_chains(scenario_id);

-- ── Snapshots ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id   UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  -- Full scenario state serialised as JSONB (encrypted fields removed)
  state         JSONB NOT NULL,
  -- Whether this snapshot has been submitted to benchmark pool
  benchmarked   BOOLEAN NOT NULL DEFAULT FALSE,
  created_by    UUID,                          -- user_id (from JWT at creation time)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS snapshots_scenario_idx ON snapshots(scenario_id, created_at DESC);

-- ── Comments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,                  -- 'initiative' | 'capability' | 'effect'
  entity_id   UUID NOT NULL,
  author_id   UUID NOT NULL,                  -- user_id
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS comments_entity_idx ON comments(entity_type, entity_id);

-- ── updated_at triggers ──────────────────────────────────
-- Reuse function from cairn_public (search_path must include it)
CREATE TRIGGER strategies_updated_at
  BEFORE UPDATE ON strategies
  FOR EACH ROW EXECUTE FUNCTION cairn_public.set_updated_at();

CREATE TRIGGER scenarios_updated_at
  BEFORE UPDATE ON scenarios
  FOR EACH ROW EXECUTE FUNCTION cairn_public.set_updated_at();

CREATE TRIGGER capabilities_updated_at
  BEFORE UPDATE ON capabilities
  FOR EACH ROW EXECUTE FUNCTION cairn_public.set_updated_at();

CREATE TRIGGER initiatives_updated_at
  BEFORE UPDATE ON initiatives
  FOR EACH ROW EXECUTE FUNCTION cairn_public.set_updated_at();

CREATE TRIGGER effects_updated_at
  BEFORE UPDATE ON effects
  FOR EACH ROW EXECUTE FUNCTION cairn_public.set_updated_at();

CREATE TRIGGER value_chains_updated_at
  BEFORE UPDATE ON value_chains
  FOR EACH ROW EXECUTE FUNCTION cairn_public.set_updated_at();

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION cairn_public.set_updated_at();

-- ── Default seed data ────────────────────────────────────
-- Insert a default strategy + scenario for new tenants
-- (Called after schema creation in the provisioning service)
