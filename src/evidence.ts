/**
 * evidence.ts — the evidence / provenance layer.
 *
 * Goals:
 *  - Turn a raw market snapshot into an `Evidence` with a content-addressed fingerprint.
 *  - Bind a set of evidence into an `inputSnapshotHash` for a Decision.
 *  - Enforce freshness via `observedAt` (the DQ1/DQ2/DQ3 data-quality invariants).
 *
 * The DataSource adapter is where the real Agent OS Data MCP plugs in. The sample source
 * in `demo.ts` is clearly labeled DEMO — never claim real data from a fake source.
 */

import { createHash } from "node:crypto";
import {
  computeInputSnapshotHash,
  decisionHash,
  evidenceFingerprint,
  randomNonce,
  sha256,
} from "./provable.js";
import type { Decision, Evidence, Side } from "./types.js";
import { utf8, concat, encodeLenPrefixed, encodeU64 } from "./canonical.js";

// ---- DataSource adapter (plug the real Agent OS Data MCP here) -------------

/**
 * A normalized, provenanced market observation. `observedAt` MUST be the block-aligned time
 * the data was observed, NOT when this object was written — that is what makes freshness
 * (DQ3) honest. `raw` is the exact bytes we later hash.
 */
export interface MarketSnapshot {
  symbol: string;
  price: bigint; // fixed-point (e.g. 1e8)
  fundingRate?: bigint; // fixed-point (e.g. 1e9 divider)
  observedAt: bigint; // block-aligned UNIX time
  source: string; // e.g. "binance-futures-funding-rate"
  // For provenance: e.g. an order-book snapshot, a price feed, a funding ticker.
  raw: string; // hex or base64 of the fetched raw payload
}

export interface DataSourceConfig {
  freshnessWindowMs: bigint; // max allowed age between observedAt and now
  clock?: () => bigint; // injectable clock (ms epoch) for testability
}

/**
 * Adapter contract for a real Agent OS Data MCP. Implement this with the actual tool call.
 * MCP tool names / response shape: REQUIRES VERIFICATION against Agent OS docs.
 */
export interface MarketDataSource {
  fetchSnapshot(symbol: string): Promise<MarketSnapshot>;
  sourceLabel: string;
}

/**
 * Build an `Evidence` from a snapshot. `contentHash` pins the raw payload; `fetchHash` pins
 * source + observedAt + contentHash so you can't swap source or timestamp after the fact.
 */
export function snapshotToEvidence(s: MarketSnapshot): Evidence {
  const contentHash = sha256(utf8(s.raw));
  const fetchHash = sha256(
    concat([
      encodeLenPrefixed(utf8(s.source)),
      encodeU64(s.observedAt),
      encodeLenPrefixed(utf8(contentHash)),
    ]),
  );
  return {
    source: s.source,
    observedAt: s.observedAt,
    payload: s.raw,
    // oracleRef optional
  };
}

/** Freshness check (DQ3): reject evidence older than the window vs. current time. */
export function isFresh(s: MarketSnapshot, cfg: DataSourceConfig): boolean {
  const now = cfg.clock ? cfg.clock() : BigInt(Date.now());
  const age = now >= s.observedAt ? now - s.observedAt : 0n;
  return age <= cfg.freshnessWindowMs;
}

/** Compute the snapshot hash that will be bound into the Decision. */
export function evidenceSetHash(snapshots: MarketSnapshot[]): string {
  return computeInputSnapshotHash(snapshots.map(snapshotToEvidence));
}

export interface EvidenceFingerprintDetail {
  contentHash: string;
  fetchHash: string;
  fingerprint: string;
}

/** For UI/audit: show provenance chains transparently. */
export function describeEvidence(s: MarketSnapshot): EvidenceFingerprintDetail {
  const e = snapshotToEvidence(s);
  const contentHash = sha256(utf8(e.payload));
  const fetchHash = sha256(
    concat([
      encodeLenPrefixed(utf8(e.source)),
      encodeU64(e.observedAt),
      encodeLenPrefixed(utf8(contentHash)),
    ]),
  );
  return { contentHash, fetchHash, fingerprint: evidenceFingerprint(e) };
}

// ---- Decision pipeline ------------------------------------------------------

export interface DecisionInputs {
  agentId: string;
  strategyVersion: number;
  symbol: string;
  side: Side;
  qty: bigint;
  snapshots: MarketSnapshot[];
  /** The private reasoning string. Hashed to reasonHash and DISCARDED — never persisted. */
  reasoning: string;
  now?: bigint; // block-aligned ts, default Date.now()
}

/**
 * Build a fully-formed Decision from real inputs. This is the single choke point where the
 * strategy's reasoning becomes a committed hash. The reasoning string itself is hashed and
 * immediately dropped from the return value — it is never stored anywhere (IP preserved).
 */
export function buildDecision(inputs: DecisionInputs): Decision {
  const ts = inputs.now ?? BigInt(Date.now());
  const inputSnapshotHash = evidenceSetHash(inputs.snapshots);
  const reasonHash = sha256(utf8(inputs.reasoning));
  return {
    agentId: inputs.agentId,
    strategyVersion: inputs.strategyVersion,
    ts,
    symbol: inputs.symbol,
    side: inputs.side,
    qty: inputs.qty,
    inputSnapshotHash,
    reasonHash,
    nonce: randomNonce(),
  };
}

export { decisionHash, evidenceFingerprint, randomNonce };
