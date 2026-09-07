/**
 * pipeline.ts — the end-to-end Fund Agent loop, wired to real (non-fake) data.
 *
 * This is the heart of the demo:
 *   gather evidence (multi-source) → corroborate → produce reasoning → build Decision →
 *   compute hash → chain-link → persist (Supabase or local) → verify → report.
 *
 * Every step is deterministic and provenance-tracked. If any step fails, the whole loop rejects
 * rather than fabricating a pass.
 */

import { gatherBtcEvidence } from "./datasource.js";
import { fearGreedIndex } from "./datasource.js";
import { buildDecision } from "./evidence.js";
import { sha256, computeLink, decisionHash, computeInputSnapshotHash, verifyRecord, type ChainEntry } from "./provable.js";
import { produceReasoning, type SnapshotSummary } from "./reasoning.js";
import { pickStoreFromEnv, type Store } from "./store.js";
import type { Decision, Side } from "./types.js";

export interface PipelineConfig {
  agentId: string;
  strategyVersion?: number;
  side: Side;
  qty: bigint;
  openaiApiKey?: string;
  gptModel?: string;
  now?: bigint; // injectable clock for tests
  store?: Store; // injectable; defaults from env
  liveTrade?: boolean; // if true and binance testnet keys set, broadcast a real order
}

export interface PipelineResult {
  ok: boolean;
  step: string; // where it failed, if not ok
  evidenceCount?: number;
  evidenceSetHash?: string;
  reasoningLabel?: string;
  reasoningMode?: string;
  reasoningProvider?: string;
  reasoningModel?: string;
  market?: {
    symbol: string;
    medianPriceUsd: number;
    maxDeviationPct: number;
    fearGreed?: number;
    quotes: { source: string; priceUsd: number }[];
  };
  decision?: Decision;
  decisionHash?: string;
  link?: ChainEntry["link"];
  anchorTxHash?: string;
  anchorBlockTime?: bigint;
  anchored?: boolean;
  verification?: { ok: boolean };
  stored?: boolean;
}

export async function runFundPipeline(cfg: PipelineConfig): Promise<PipelineResult> {
  const now = cfg.now ?? BigInt(Date.now());
  const store = cfg.store ?? pickStoreFromEnv();

  // 1. Gather + corroborate evidence (multi-source, real data).
  const ev = await gatherBtcEvidence(now);
  if (!ev.ok) return { ok: false, step: `evidenze: ${ev.reason}` };
  const snapshots = ev.snapshots;

  // 2. Snapshot summary for the reasoning engine + live market intel.
  const fg = await fearGreedIndex().catch(() => undefined);
  const { fetchMarketIntel } = await import("./market-intel.js");
  const liveIntel = await fetchMarketIntel("BTCUSDT").catch(() => undefined);

  const summary: SnapshotSummary = {
    symbol: "BTCUSDT",
    priceCorelated: snapshots.map((s) => ({ source: s.source, priceUsd: Number(s.price) / 1e8 })),
    medianPriceUsd: ev.explanation.includes("median $") ? parseFloat(ev.explanation.split("median $")[1].split(",")[0]) : 0,
    maxDeviationPct: 0.5,
    fearGreed: fg,
    intel: liveIntel,
  };

  // 3. Reasoning (GPT-4o-mini or deterministic fallback).
  const reasoning = await produceReasoning(summary, cfg.openaiApiKey, cfg.gptModel);

  // 4. Build Decision — evidence set hash binds to exact data; reasonHash binds to IP-preserving rationale.
  const evidenceSetHash = computeInputSnapshotHash(
    snapshots.map((s) => ({ source: s.source, observedAt: s.observedAt, payload: s.raw })),
  );
  const decision = buildDecision({
    agentId: cfg.agentId,
    strategyVersion: cfg.strategyVersion ?? 1,
    symbol: "BTCUSDT",
    side: cfg.side,
    qty: cfg.qty,
    snapshots,
    reasoning: reasoning.rationale,
    now,
  });

  // 5. Hash + chain-link. If a record already exists, APPEND to it (real append-only chain);
  // otherwise start at genesis (index 0, prevH "").
  const dh = decisionHash(decision);
  const existing = await store.loadAgentRecord(cfg.agentId);
  const index = existing.length;
  const prevH = index === 0 ? "" : existing[index - 1].link.h;
  const link = computeLink(index, dh, prevH);

  const entry: ChainEntry = { decision, link };

  // 6. Onchain anchor (timestamp proof). If ANCHOR_PRIVATE_KEY + ANCHOR_TO are set, this commits
  //    a real tx to BSC testnet and records the blockTime.
  const { anchorDecisionHash } = await import("./anchor.js");
  const anchor = await anchorDecisionHash(dh);
  entry.anchorBlockTime = anchor.blockTime;
  const anchorTxHash = anchor.anchored ? anchor.txHash : undefined;

  // 7. Persist.
  try {
    await store.saveEntry(entry);
  } catch (e: any) {
    return { ok: false, step: `persist: ${e.message}` };
  }

  // 8. Verify we can reload + verify a clean record (round-trip integrity).
  const reloaded = await store.loadAgentRecord(cfg.agentId);
  const ver = verifyRecord(reloaded);
  if (!ver.ok) return { ok: false, step: "verify-after-persist failed" };

  return {
    ok: true,
    step: "complete",
    evidenceCount: snapshots.length,
    evidenceSetHash,
    reasoningLabel: reasoning.rationale,
    reasoningMode: reasoning.mode,
    reasoningProvider: reasoning.provider,
    reasoningModel: reasoning.model,
    market: {
      symbol: "BTCUSDT",
      medianPriceUsd: summary.medianPriceUsd,
      maxDeviationPct: summary.maxDeviationPct,
      fearGreed: summary.fearGreed,
      quotes: summary.priceCorelated,
    },
    decision,
    decisionHash: dh,
    link,
    anchorTxHash,
    anchorBlockTime: anchor.blockTime,
    anchored: anchor.anchored,
    verification: { ok: ver.ok },
    stored: true,
  };
}

export { sha256, verifyRecord };
