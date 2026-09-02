-- Supabase schema for Provable Alpha
-- Run these in the Supabase SQL editor. Uses the free-tier Postgres.
--
-- Design notes:
--  * `provable_ledger` stores the raw decision JSON so a verifier can RE-DERIVE the decision
--    hash and compare against the stored one — that's the whole tamper-evidence story.
--  * `provable_evidence` is the provenance store (content-addressed).
--  * `provable_agent_facts` holds immutable realized facts (derived analytics are computed
--    from these, not stored).
--  * Reasoning is NEVER stored — only reasonHash (inside the decision JSON).

create table if not exists provable_evidence (
  fingerprint    text primary key,      -- SHA256 of the evidence
  source         text not null,
  observed_at    text not null,          -- ms epoch (string; BigInt-safe)
  payload        text not null,          -- raw bytes (hex/base64)
  oracle_ref     text,
  created_at     timestamptz not null default now()
);

create table if not exists provable_ledger (
  id                uuid primary key default gen_random_uuid(),
  agent_id          text not null,
  index             bigint not null,
  decision_hash     text not null,
  link_hash         text not null,
  prev_link_hash    text not null,
  anchor_block_time text,
  fill_price        text,
  fill_qty          text,
  fill_time         text,
  order_id          text,
  canonical_decision jsonb not null,
  created_at        timestamptz not null default now(),
  unique (agent_id, index)
);

create index if not exists idx_ledger_agent
  on provable_ledger (agent_id, index);

create table if not exists provable_agent_facts (
  agent_id              text primary key,
  total_capital_committed text not null default '0',
  realized_pnl          text not null default '0',
  winning_capital       text not null default '0',
  losing_capital        text not null default '0',
  resolved_count        int not null default 0,
  largest_loss          text not null default '0',
  largest_win           text not null default '0',
  challenge_wins        int not null default 0,
  challenge_resolved    int not null default 0,
  no_contest_count      int not null default 0,
  updated_at            timestamptz not null default now()
);

-- Security: for a single-operator demo, lock down writes to the service role by default.
-- Most Supabase projects start with RLS enabled; rows are only written via the service key.
-- If you keep anon access, add a per-agent row policy instead of disabling RLS.
alter table provable_evidence enable row level security;
alter table provable_ledger  enable row level security;
alter table provable_agent_facts enable row level security;

-- Example: read access for the verifier agent (adjust to your auth model).
-- create policy "ledger_read" on provable_ledger for select using (true);
