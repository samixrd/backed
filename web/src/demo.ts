/**
 * demo.ts — a runnable, clearly-labeled DEMO of the Provable Alpha agent loop.
 *
 * This wires the evidence layer + decision + hash-chain + verifier together and prints
 * everything a judge would want to see: provenance, the committed hash, the chain, and —
 * crucially — a demonstration that tampering with any entry breaks verification.
 *
 * NOTHING HERE IS REAL MARKET DATA. Every price/funding/raw is a hard-coded DEMO value.
 * The real Agent OS Data MCP / Trading MCP / Onchain MCP plug in via the adapters in
 * evidence.ts (MarketDataSource) and the CLI (see cli.ts).
 */

import {
  buildDecision,
  describeEvidence,
  isFresh,
  snapshotToEvidence,
  type MarketSnapshot,
  type DataSourceConfig,
} from "./evidence.js";
import { computeLink, decisionHash, verifyRecord, type ChainEntry } from "./provable.js";
import type { Fill } from "./types.js";

// ---- DEMO data (NOT REAL) ---------------------------------------------------
const DEMO_FRESH_WINDOW = 60_000n; // 60s
const demoSnapshots: MarketSnapshot[] = [
  {
    symbol: "BTCUSDT",
    price: 64_000_000_000n, // 64000.00000000 (1e8)
    fundingRate: 1_000_000n, // 0.0001 (1e9 divider) — demo
    observedAt: 1_752_000_000_000n,
    source: "binance-futures-funding-rate",
    raw: "0xd3a7cbf1e2f0946002021",
  },
  {
    symbol: "BTCUSDT",
    price: 64_000_000_000n,
    observedAt: 1_752_000_001_000n,
    source: "binance-price-ticker",
    raw: "0x99e2f0b1a4",
  },
];

// A demo clock so freshness is deterministic.
const demoNow = () => 1_752_000_001_500n;

// ---- The agent loop ---------------------------------------------------------
function runDemo() {
  const log = console.log;
  log("=== PROVABLE ALPHA — DEMO LOOP (NOT REAL DATA) ===\n");

  // Step 1: ingest + provenance (data-quality visible to the judge)
  log("── Evidence ingestion & provenance ──");
  for (const s of demoSnapshots) {
    const det = describeEvidence(s);
    log(`  source=${s.source} observedAt=${s.observedAt}`);
    log(`    contentHash=${det.contentHash.slice(0, 16)}…`);
    log(`    fetchHash  =${det.fetchHash.slice(0, 16)}…`);
    log(`    fingerprint=${det.fingerprint.slice(0, 16)}…`);
  }
  const fresh = demoSnapshots.every((s) => isFresh(s, { freshnessWindowMs: DEMO_FRESH_WINDOW, clock: demoNow } satisfies DataSourceConfig));
  log(`  freshness(60s window): ${fresh ? "PASS" : "FAIL"}\n`);

  // Step 2: decision (reasoning is hashed then discarded — never stored)
  log("── Decision commit ──");
  const decision = buildDecision({
    agentId: "0xBACKED-Alpha",
    strategyVersion: 1,
    symbol: "BTCUSDT",
    side: "BUY",
    qty: 10_000_000_000n, // 100.0 BTC (1e8)
    snapshots: demoSnapshots,
    reasoning: "Funding positive + price above EMA(20); expect continuation.<<PRIVATE-REASONING>>",
    now: BigInt(1_752_000_001_500n),
  });
  const dh = decisionHash(decision);
  log(`  decisionHash     = ${dh}`);
  log(`  inputSnapshotHash= ${decision.inputSnapshotHash.slice(0, 24)}…`);
  log(`  reasonHash       = ${decision.reasonHash}  (reasoning NOT stored)`);
  log(`  (reasoning content is hashed and dropped — IP preserved)\n`);

  // Step 3: chain links
  const d2 = buildDecision({
    agentId: "0xBACKED-Alpha",
    strategyVersion: 1,
    symbol: "BTCUSDT",
    side: "SELL",
    qty: 5_000_000_000n,
    snapshots: demoSnapshots,
    reasoning: "Take partial profit; funding cooling.<<PRIVATE-REASONING>>",
    now: BigInt(1_752_000_002_500n),
  });
  const e0: ChainEntry = { decision, link: computeLink(0, dh, "") };
  const e1: ChainEntry = { decision: d2, link: computeLink(1, decisionHash(d2), e0.link.h) };

  // Step 4: ordering (anchor before fill — no backdate)
  const fill: Fill = { orderId: "DEMO-ord-1", fillPrice: 64_000_000_100n, fillQty: 10_000_000_000n, fillTime: 1_752_000_001_900n, fee: 0n };
  e0.anchorBlockTime = 1_752_000_001_500n;
  e0.fill = fill;

  log("── Record verify (clean) ──");
  const clean = verifyRecord([e0, e1], { checkOrdering: true });
  log(`  PASS/FAIL: ${clean.ok ? "PASS ✓" : "FAIL ✗"}`);
  for (const s of clean.steps) log(`    ${s.pass ? "✓" : "✗"} ${s.name}`);
  console.log("");

  // Step 5: TAMPER — prove the engine catches it
  log("── Tamper attempt (must FAIL) ──");
  const tampered: ChainEntry[] = [
    e0,
    { decision: { ...d2, qty: 999_999_999_999n }, link: e1.link, anchorBlockTime: e1.anchorBlockTime, fill: e1.fill },
  ];
  const bad = verifyRecord(tampered, { checkOrdering: true });
  log(`  tampered qty → PASS/FAIL: ${bad.ok ? "PASS ✗ (BAD)" : "FAIL ✓ (correctly caught)"}`);

  // Step 6: BACKDATE — prove ordering catches it
  const backdate: ChainEntry[] = [
    { decision: e0.decision, link: e0.link, anchorBlockTime: e0.anchorBlockTime, fill: { ...fill, fillTime: 1_752_000_001_000n } },
    e1,
  ];
  const bd = verifyRecord(backdate, { checkOrdering: true });
  log(`  backdated fill → PASS/FAIL: ${bd.ok ? "PASS ✗ (BAD)" : "FAIL ✓ (correctly caught)"}`);

  console.log("\nDone. Replace DEMO data with real Agent OS MCP adapters for live mode.");
}

runDemo();
