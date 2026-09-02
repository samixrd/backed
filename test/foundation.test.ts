/**
 * foundation.test.ts — tests for the Provable Alpha trust engine.
 *
 * These are the ground-truth checks for the whole project: canonical determinism,
 * collision-resistance, snapshot binding, hash-chain continuity, reorder/delete detection,
 * and backdating detection.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canonicalDecision,
  decisionHash,
  evidenceFingerprint,
  computeInputSnapshotHash,
  computeLink,
  sha256,
  verifyRecord,
  randomNonce,
  type ChainEntry,
} from "../src/provable.js";
import type { Decision, Evidence, Fill } from "../src/types.js";

function mkDecision(over: Partial<Decision> = {}): Decision {
  return {
    agentId: "0xagent-alpha",
    strategyVersion: 1,
    ts: 1_700_000_000_000n,
    symbol: "BTCUSDT",
    side: "BUY",
    qty: 100_000_000n, // fixed-point 1e8 => 1.0 BTC
    inputSnapshotHash: "a".repeat(64),
    reasonHash: "b".repeat(64),
    nonce: 1n,
    ...over,
  };
}

function mkEntry(decisions: Decision[], over: Partial<Omit<ChainEntry, "decision" | "link">>[] = []): ChainEntry[] {
  let prevH = "";
  return decisions.map((d, i) => {
    const link = computeLink(i, decisionHash(d), prevH);
    prevH = link.h;
    return { decision: d, link, ...(over[i] ?? {}) };
  });
}

function fill(t: bigint): Fill {
  return { orderId: "o", fillPrice: 100n, fillQty: 1n, fillTime: t, fee: 0n };
}

test("canonical serialization is deterministic", () => {
  const d = mkDecision();
  assert.equal(sha256(canonicalDecision(d)), sha256(canonicalDecision({ ...d })));
  assert.equal(decisionHash(d), decisionHash({ ...d }));
});

test("hash is sensitive to every field", () => {
  const base = mkDecision();
  const fields: Partial<Decision>[] = [
    { agentId: "0xagent-beta" },
    { strategyVersion: 2 },
    { ts: 1_800_000_000_000n },
    { symbol: "ETHUSDT" },
    { side: "SELL" },
    { qty: 200_000_000n },
    { inputSnapshotHash: "c".repeat(64) },
    { reasonHash: "d".repeat(64) },
    { nonce: 2n },
  ];
  for (const f of fields) {
    assert.notEqual(decisionHash(base), decisionHash(mkDecision(f)), `field ${Object.keys(f)[0]} ignored`);
  }
});

test("inputSnapshotHash is order-independent but content-addressed", () => {
  const evs: Evidence[] = [
    { source: "binance-funding", observedAt: 1n, payload: "0x01" },
    { source: "binance-price", observedAt: 1n, payload: "0x02" },
  ];
  const snap = computeInputSnapshotHash(evs);
  const reordered = computeInputSnapshotHash([evs[1], evs[0]]);
  assert.equal(snap, reordered, "sorted snapshot must be order-independent");
  const changed = computeInputSnapshotHash([
    { source: "binance-funding", observedAt: 1n, payload: "0x99" },
    { source: "binance-price", observedAt: 1n, payload: "0x02" },
  ]);
  assert.notEqual(snap, changed, "payload change must change snapshot");
});

test("evidence fingerprint is content-addressed", () => {
  const base: Evidence = { source: "src", observedAt: 10n, payload: "0xabcdef" };
  assert.equal(evidenceFingerprint(base), evidenceFingerprint({ ...base }));
  assert.notEqual(evidenceFingerprint(base), evidenceFingerprint({ ...base, payload: "0xabceff" }));
  assert.notEqual(evidenceFingerprint(base), evidenceFingerprint({ ...base, observedAt: 11n }));
});

test("clean record passes; reorder / delete / edit break it", () => {
  const d0 = mkDecision({ nonce: 0n });
  const d1 = mkDecision({ nonce: 1n });
  const d2 = mkDecision({ nonce: 2n });

  const clean = mkEntry([d0, d1, d2]);
  assert.equal(verifyRecord(clean).ok, true, "clean record should pass");

  // Reorder: build a valid chain but then swap entries 1 and 2 (links become stale).
  const swapped = mkEntry([d0, d1, d2]);
  [swapped[1], swapped[2]] = [swapped[2], swapped[1]];
  assert.equal(verifyRecord(swapped).ok, false, "reorder should fail");

  // Delete an entry: contiguity breaks.
  const deleted = mkEntry([d0, d1, d2]);
  deleted.splice(1, 1);
  assert.equal(verifyRecord(deleted).ok, false, "delete should fail");

  // Edit: tamper qty.
  const tampered = mkEntry([d0, d1, d2]);
  tampered[1] = { ...tampered[1], decision: { ...tampered[1].decision, qty: 999n } };
  assert.equal(verifyRecord(tampered).ok, false, "edit should fail");
});

test("ordering check rejects backdating", () => {
  const d0 = mkDecision({ nonce: 0n });
  const backdated = mkEntry([d0], [{ anchorBlockTime: 1_700_000_000_050n, fill: fill(1_700_000_000_000n) }]);
  assert.equal(verifyRecord(backdated, { checkOrdering: true }).ok, false, "anchor after fill should fail");

  const good = mkEntry([d0], [{ anchorBlockTime: 1_700_000_000_000n, fill: fill(1_700_000_000_050n) }]);
  assert.equal(verifyRecord(good, { checkOrdering: true }).ok, true, "anchor before fill should pass");
});

test("randomNonce is unique and non-negative", () => {
  const a = randomNonce();
  const b = randomNonce();
  assert.notEqual(a, b);
  assert.ok(a > 0n);
});

test("computeLink binds index + prevH + dataHash", () => {
  const l1 = computeLink(0, decisionHash(mkDecision()), "");
  const l2 = computeLink(0, decisionHash(mkDecision()), "");
  assert.equal(l1.h, l2.h);
  const l3 = computeLink(1, decisionHash(mkDecision()), "");
  assert.notEqual(l1.h, l3.h);
});
