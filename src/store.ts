/**
 * store.ts — persistence layer for Provable Alpha.
 *
 * The whole point of pushing storage to Supabase is to keep the 1GB Azure VM light: the VM only
 * holds the agent loop + hashing in memory. Evidence, ledger entries, and agent facts live in
 * Postgres (Supabase free tier) and are queried back for verification.
 *
 * Two implementations share one interface:
 *   - SupabaseStore  : the production path (Postgres tables, see schema below).
 *   - LocalStore     : a JSON-file fallback so the demo + tests run with no credentials.
 *
 * Store only *facts* — never the reasoning string. That's what makes the record verifiable
 * ohne IP leak (reasoning is hashed to reasonHash and discarded).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as fs from "node:fs";
import * as path from "node:path";
import type { ChainEntry } from "./provable.js";
import type { Evidence, Decision } from "./types.js";

/** A verifiable agent-fact row (derived analytics are computed from these, not stored). */
export interface AgentFacts {
  agentId: string;
  totalCapitalCommitted: string; // fixed-point string (BigInt-safe)
  realizedPnl: string;
  winningCapital: string;
  losingCapital: string;
  resolvedCount: number;
  largestLoss: string;
  largestWin: string;
  challengeWins: number;
  challengeResolved: number;
  noContestCount: number;
  updatedAt: string;
}

/** Persistence boundary. All heavy data goes here; the VM stays light. */
export interface Store {
  saveEvidence(evidence: Evidence, fingerprint: string): Promise<void>;
  saveEntry(entry: ChainEntry): Promise<void>;
  loadAgentRecord(agentId: string): Promise<ChainEntry[]>;
  upsertFacts(facts: AgentFacts): Promise<void>;
  loadFacts(agentId: string): Promise<AgentFacts | null>;
}

// ============================================================================
// SUPABASE STORE (production path)
// ============================================================================

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

const EVIDENCE_TABLE = "provable_evidence";
const LEDGER_TABLE = "provable_ledger";
const FACTS_TABLE = "provable_agent_facts";

export class SupabaseStore implements Store {
  private client: SupabaseClient<any, "backed">;

  constructor(cfg: SupabaseConfig) {
    // Point queries at the `backed` schema so we never touch Sidekick's `public.*` tables.
    this.client = createClient(cfg.url, cfg.anonKey, { db: { schema: "backed" } });
  }

  async saveEvidence(evidence: Evidence, fingerprint: string): Promise<void> {
    const { error } = await this.client.from(EVIDENCE_TABLE).upsert({
      fingerprint,
      source: evidence.source,
      observed_at: evidence.observedAt.toString(),
      payload: evidence.payload,
      oracle_ref: evidence.oracleRef ?? null,
    });
    if (error) throw new Error(`saveEvidence: ${error.message}`);
  }

  async saveEntry(entry: ChainEntry): Promise<void> {
    const { error } = await this.client.from(LEDGER_TABLE).insert({
      agent_id: entry.decision.agentId,
      index: entry.link.index,
      decision_hash: entry.link.dataHash,
      link_hash: entry.link.h,
      prev_link_hash: entry.link.prevH,
      anchor_block_time: entry.anchorBlockTime?.toString() ?? null,
      fill_price: entry.fill?.fillPrice.toString() ?? null,
      fill_qty: entry.fill?.fillQty.toString() ?? null,
      fill_time: entry.fill?.fillTime.toString() ?? null,
      order_id: entry.fill?.orderId ?? null,
      canonical_decision: JSON.stringify(entry.decision, (_k, v) =>
        typeof v === "bigint" ? v.toString() : v,
      ),
    });
    if (error) throw new Error(`saveEntry: ${error.message}`);
  }

  async loadAgentRecord(agentId: string): Promise<ChainEntry[]> {
    const { data, error } = await this.client
      .from(LEDGER_TABLE)
      .select("*")
      .eq("agent_id", agentId)
      .order("index", { ascending: true });
    if (error) throw new Error(`loadAgentRecord: ${error.message}`);
    return (data ?? []).map((row) => deserializeEntry(row));
  }

  async upsertFacts(facts: AgentFacts): Promise<void> {
    const { error } = await this.client.from(FACTS_TABLE).upsert(facts);
    if (error) throw new Error(`upsertFacts: ${error.message}`);
  }

  async loadFacts(agentId: string): Promise<AgentFacts | null> {
    const { data, error } = await this.client
      .from(FACTS_TABLE)
      .select("*")
      .eq("agent_id", agentId)
      .single();
    if (error) return null;
    return data as AgentFacts;
  }
}

// ============================================================================
// LOCAL STORE (demo / test fallback — no credentials)
// ============================================================================

export class LocalStore implements Store {
  private dir: string;
  private buf: Map<string, string>;

  constructor(dir = path.join(process.cwd(), ".backed-data")) {
    this.dir = dir;
    this.buf = new Map();
    fs.mkdirSync(dir, { recursive: true });
  }

  private fileFor(key: string) {
    return path.join(this.dir, `${key}.json`);
  }

  private read<T>(key: string, fallback: T, revive = true): T {
    const p = this.fileFor(key);
    if (!fs.existsSync(p)) return fallback;
    try {
      const raw = fs.readFileSync(p, "utf8");
      // Facts we store as BigInt-safe strings and must NOT be re-cast to BigInt; the
      // AgentFacts fields are deliberately strings. Only ledger/evidence bigints need revival.
      return (revive ? JSON.parse(raw, reviveBigInt) : JSON.parse(raw)) as T;
    } catch {
      return fallback;
    }
  }

  private write(key: string, value: unknown) {
    fs.writeFileSync(this.fileFor(key), JSON.stringify(value, (_k, v) =>
      typeof v === "bigint" ? v.toString() : v,
    ));
  }

  async saveEvidence(evidence: Evidence, fingerprint: string): Promise<void> {
    const list = this.read<Record<string, Evidence>>("evidence", {});
    list[fingerprint] = evidence;
    this.write("evidence", list);
    this.buf.set(fingerprint, fingerprint);
  }

  async saveEntry(entry: ChainEntry): Promise<void> {
    const key = `ledger_${entry.decision.agentId}`;
    const ledger = this.read<ChainEntry[]>(key, []);
    ledger.push(entry);
    this.write(key, ledger);
  }

  async loadAgentRecord(agentId: string): Promise<ChainEntry[]> {
    return this.read<ChainEntry[]>(`ledger_${agentId}`, []);
  }

  async upsertFacts(facts: AgentFacts): Promise<void> {
    const key = `facts_${facts.agentId}`;
    this.write(key, facts);
  }

  async loadFacts(agentId: string): Promise<AgentFacts | null> {
    return this.read<AgentFacts | null>(`facts_${agentId}`, null, false);
  }
}

// ============================================================================
// helpers
// ============================================================================

function deserializeEntry(row: any): ChainEntry {
  const decision = JSON.parse(row.canonical_decision, reviveBigInt) as Decision;
  const link = {
    index: row.index,
    prevH: row.prev_link_hash,
    dataHash: row.decision_hash,
    h: row.link_hash,
  };
  const entry: ChainEntry = { decision, link };
  if (row.anchor_block_time != null) entry.anchorBlockTime = BigInt(row.anchor_block_time);
  if (row.fill_price != null) {
    entry.fill = {
      orderId: row.order_id,
      fillPrice: BigInt(row.fill_price),
      fillQty: BigInt(row.fill_qty),
      fillTime: BigInt(row.fill_time),
      fee: 0n,
    };
  }
  return entry;
}

function reviveBigInt(_k: string, v: any): any {
  // Revive ALL pure-integer strings to BigInt. Our numeric fields (ts, qty, nonce, fill prices,
  // observedAt) can be any length, and leaving them as strings breaks canonical hashing.
  if (typeof v === "string" && /^-?\d+$/.test(v)) return BigInt(v);
  return v;
}

/** Pick store from env: SUPABASE_URL + SUPABASE_ANON_KEY => Supabase, else local. */
export function pickStoreFromEnv(): Store {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (url && anon) return new SupabaseStore({ url, anonKey: anon });
  return new LocalStore();
}
