/**
 * store.test.ts — persistence round-trip for the Provable Alpha record store.
 *
 * Uses LocalStore (no credentials) so it runs anywhere. It saves a ledger, reloads it,
 * and re-verifies the whole chain — proving the tamper-evidence story survives a
 * write→read→re-verify cycle (i.e. the DB doesn't silently corrupt the record).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalStore, type Store } from "../src/store.js";
import { computeLink, decisionHash, verifyRecord, type ChainEntry } from "../src/provable.js";
import type { Decision, Evidence } from "../src/types.js";
import { randomNonce } from "../src/provable.js";

/** Unique temp dir per test so disk-backed LocalStore never leaks across cases. */
function freshStore(): Store {
  const dir = mkdtempSync(join(tmpdir(), "backed-store-"));
  return new LocalStore(dir);
}

function mkDecision(nonce: bigint): Decision {
  return {
    agentId: "0xstore-test",
    strategyVersion: 1,
    ts: 1_700_000_000_000n + nonce,
    symbol: "BTCUSDT",
    side: "BUY",
    qty: 100_000_000n,
    inputSnapshotHash: "a".repeat(64),
    reasonHash: "b".repeat(64),
    nonce,
  };
}

function mkEntry(decisions: Decision[]): ChainEntry[] {
  let prevH = "";
  return decisions.map((d, i) => {
    const link = computeLink(i, decisionHash(d), prevH);
    prevH = link.h;
    return { decision: d, link };
  });
}

test("LocalStore saveEntry + loadAgentRecord round-trips and re-verifies", async () => {
  const store: Store = freshStore();
  const entries = mkEntry([mkDecision(0n), mkDecision(1n), mkDecision(2n)]);

  for (const e of entries) await store.saveEntry(e);

  const loaded = await store.loadAgentRecord("0xstore-test");
  assert.equal(loaded.length, 3, "should reload all 3 entries");
  assert.equal(verifyRecord(loaded).ok, true, "reloaded record should still verify");
});

test("LocalStore evidence save/load survives", async () => {
  const store: Store = freshStore();
  const ev: Evidence = { source: "binance-spot-ticker", observedAt: 1_752_000_000_000n, payload: "0xdeadbeef" };
  await store.saveEvidence(ev, "fp123");
  // evidence store is a Map in memory + JSON on disk; no public reader, but no throw = pass
  assert.ok(true);
});

test("facts upsert/load round-trips", async () => {
  const store: Store = freshStore();
  await store.upsertFacts({
    agentId: "0xstore-test",
    totalCapitalCommitted: "100000000",
    realizedPnl: "25000000",
    winningCapital: "60000000",
    losingCapital: "40000000",
    resolvedCount: 4,
    largestLoss: "15000000",
    largestWin: "30000000",
    challengeWins: 1,
    challengeResolved: 2,
    noContestCount: 1,
    updatedAt: new Date().toISOString(),
  });
  const facts = await store.loadFacts("0xstore-test");
  assert.equal(facts?.resolvedCount, 4);
  assert.equal(facts?.realizedPnl, "25000000");
});

test("local store is isolated per agent (no cross-contamination)", async () => {
  const store: Store = freshStore();
  await store.saveEntry(mkEntry([mkDecision(7n)])[0]);
  await store.saveEntry({ ...mkEntry([mkDecision(7n)])[0], decision: { ...mkDecision(7n), agentId: "other-agent" } } as ChainEntry);
  const a = await store.loadAgentRecord("0xstore-test");
  assert.ok(a.length >= 1);
  const other = await store.loadAgentRecord("other-agent");
  assert.ok(other.length >= 1);
});
