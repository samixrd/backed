/**
 * verifier.test.ts — the audit agent must PASS genuine records and FAIL tampered ones.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalStore, type Store } from "../src/store.js";
import { computeLink, decisionHash, type ChainEntry } from "../src/provable.js";
import { auditAgentRecord, auditEntries, formatReport } from "../src/verifier.js";
import type { Decision } from "../src/types.js";

function mkDecision(nonce: bigint, agentId = "0xagent-x"): Decision {
  return {
    agentId,
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

function buildRecord(decisions: Decision[]): ChainEntry[] {
  let prevH = "";
  return decisions.map((d, i) => {
    const link = computeLink(i, decisionHash(d), prevH);
    prevH = link.h;
    return { decision: d, link };
  });
}

async function seed(entries: ChainEntry[], agentId = "0xagent-x"): Promise<Store> {
  const store: Store = new LocalStore(mkdtempSync(join(tmpdir(), "verifier-")));
  for (const e of entries) await store.saveEntry(e);
  return store;
}

test("audit PASSes a genuine record", async () => {
  const store = await seed(buildRecord([mkDecision(0n), mkDecision(1n), mkDecision(2n)]));
  const r = await auditAgentRecord(store, "0xagent-x");
  assert.equal(r.verdict, "PASS");
  assert.equal(r.checks.every((c) => c.pass), true);
});

test("audit FAILs a tampered qty", async () => {
  const rec = buildRecord([mkDecision(0n), mkDecision(1n)]);
  rec[1] = { ...rec[1], decision: { ...rec[1].decision, qty: 999_999_999_999n } } as ChainEntry;
  const store = await seed(rec);
  const r = await auditAgentRecord(store, "0xagent-x");
  assert.equal(r.verdict, "FAIL");
  assert.equal(r.checks.some((c) => !c.pass), true);
});

test("audit FAILs a reordered record", async () => {
  const rec = buildRecord([mkDecision(0n), mkDecision(1n), mkDecision(2n)]);
  const tmp = rec[1];
  rec[1] = rec[2];
  rec[2] = tmp;
  const store = await seed(rec);
  const r = await auditAgentRecord(store, "0xagent-x");
  assert.equal(r.verdict, "FAIL");
});

test("audit FAILs cross-agent splicing (via pure auditEntries)", () => {
  // Build a record but splice a decision from a different agent into the middle.
  const rec = buildRecord([mkDecision(0n), mkDecision(1n, "0xother-agent"), mkDecision(2n)]);
  const r = auditEntries(rec, "0xagent-x");
  assert.equal(r.verdict, "FAIL");
  assert.ok(r.checks.some((c) => c.name === "agent_bound" && !c.pass));
});

test("audit FLAGS backdated ordering when requested", async () => {
  const d = mkDecision(0n);
  const rec = buildRecord([d]);
  rec[0] = {
    decision: d,
    link: rec[0].link,
    anchorBlockTime: 1_700_000_000_200n,
    fill: { orderId: "o1", fillPrice: 100n, fillQty: 1n, fillTime: 1_700_000_000_100n, fee: 0n },
  } as ChainEntry;
  const store = await seed(rec);
  const r = await auditAgentRecord(store, "0xagent-x", { checkOrdering: true });
  assert.equal(r.verdict, "FAIL");
  assert.ok(r.checks.some((c) => c.name === "entry[0].ordering" && !c.pass));
});

test("formatReport is readable for demo", async () => {
  const store = await seed(buildRecord([mkDecision(0n)]));
  const r = await auditAgentRecord(store, "0xagent-x");
  const out = formatReport(r);
  assert.ok(out.includes("PASS"));
  assert.ok(out.includes("decisionHash"));
});
