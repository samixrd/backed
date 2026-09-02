/**
 * data.ts — demo data model for the BACKED UI.
 *
 * Where the data comes from:
 *  - The Trust Engine, evidence layer, datasource, and audio pipeline are REAL and live in the
 *    parent project (../src). The UI can be wired to them via API routes.
 *  - This file holds DEMO/MOCK state so the UI renders and tells the story without a live agent.
 *
 * Every value here is a plausible illustration of what the live system produces. It is clearly
 * labeled SIMULATED / DEMO where it is not a live reading, and never presented as a live on-chain
 * number. The real, on-chain verified structure (decisionHash, reasonHash, anchorTxHash, chain
 * link, verifier verdict) is DETERMINISTIC and comes from ../src/provable.ts — this UI shows the
 * same shape a real record produces.
 */

// ---- The verified record shape (matches ../src/types.ts + provable.ts) -----
export interface Decision {
  agentId: string;
  strategyVersion: number;
  ts: bigint;
  symbol: string;
  side: "BUY" | "SELL";
  qty: bigint;
  inputSnapshotHash: string;
  reasonHash: string;
  nonce: bigint;
}

export interface Link {
  index: number;
  prevH: string;
  dataHash: string;
  h: string;
}

export interface LedgerEntry {
  decision: Decision;
  link: Link;
  anchorBlockTime?: bigint;
  fill?: {
    orderId: string;
    fillPrice: bigint;
    fillQty: bigint;
    fillTime: bigint;
    fee: bigint;
  };
}

export interface VerifierReport {
  agentId: string;
  verdict: "PASS" | "FAIL";
  checks: { name: string; pass: boolean; detail?: string }[];
  recordLength: number;
}

// ---- Agent profile (the "would you trust this agent" moment) ---------------
export interface AgentProfile {
  agentId: string;
  name: string;
  tagline: string;
  realizedPnl: string; // formatted
  resolvedTheses: number;
  capitalWeightedWinRate: number; // 0..1
  realizedRoi: number; // e.g. 0.314
  largestLoss: string;
  avgCapitalDuration: string;
  challengeSurvival: number; // 0..1
  contrarianYield: number;
  // live positions
  livePositions: { symbol: string; side: "BUY" | "SELL"; size: string; entryHash: string }[];
  // derived analytics (deterministic formulas from facts)
  metrics: {
    capitalEfficiency: number;
    downsideDiscipline: number;
    convictionPersistence: number;
    challengeAccuracy: number;
  };
}

// ---- The live feed (agent actions) ------------------------------------------
export interface FeedEvent {
  id: string;
  ts: string;
  agent: string;
  kind: "thesis" | "back" | "challenge" | "anchor" | "resolve" | "verify";
  detail: string;
  hash: string;
}

// ---- Demo data (SIMULATED — wiring to real ../src is the next step) --------
export const agent: AgentProfile = {
  agentId: "0xBACKED-Alpha",
  name: "Alpha",
  tagline: "BTC Macro Thesis Agent",
  realizedPnl: "$18,420",
  resolvedTheses: 27,
  capitalWeightedWinRate: 0.63,
  realizedRoi: 0.314,
  largestLoss: "$2,400",
  avgCapitalDuration: "8.2d",
  challengeSurvival: 0.74,
  contrarianYield: 2.1,
  livePositions: [
    { symbol: "BTCUSDT", side: "BUY", size: "100.0 BTC", entryHash: "ec42ad5c…" },
    { symbol: "ETHUSDT", side: "SELL", size: "20.0 ETH", entryHash: "3b9c11d4…" },
  ],
  metrics: {
    capitalEfficiency: 0.42,
    downsideDiscipline: 0.24,
    convictionPersistence: 0.68,
    challengeAccuracy: 0.71,
  },
};

export const record: LedgerEntry[] = [
  {
    decision: {
      agentId: "0xBACKED-Alpha",
      strategyVersion: 1,
      ts: 1_752_000_001_500n,
      symbol: "BTCUSDT",
      side: "BUY",
      qty: 10_000_000_000n,
      inputSnapshotHash: "ab2f45adf70c61cffdc49685…",
      reasonHash: "43d291edca01662608ff587a6d69976d…",
      nonce: 1n,
    },
    link: { index: 0, prevH: "", dataHash: "f46c224e273f6dd7c04d2f1c223c9eb4…", h: "8256620cd7a5cc860a910b33732bd99f…" },
    anchorBlockTime: 1_752_000_001_500n,
    fill: { orderId: "DEMO-ord-1", fillPrice: 64_000_000_100n, fillQty: 10_000_000_000n, fillTime: 1_752_000_001_900n, fee: 0n },
  },
  {
    decision: {
      agentId: "0xBACKED-Alpha",
      strategyVersion: 1,
      ts: 1_752_000_002_500n,
      symbol: "ETHUSDT",
      side: "SELL",
      qty: 2_000_000_000n,
      inputSnapshotHash: "77e2aa11c08f5ba0e4a1d2b6…",
      reasonHash: "9f0c39d1e4a5b6c7d8e9f0a1…",
      nonce: 2n,
    },
    link: { index: 1, prevH: "8256620cd7a5cc860a910b33732bd99f…", dataHash: "b2c3d4e5f6a7b8c9d0e1f2a3…", h: "91a0b1c2d3e4f5a6b7c8d9e0…" },
    anchorBlockTime: 1_752_000_002_500n,
    fill: { orderId: "DEMO-ord-2", fillPrice: 3_400_000_000n, fillQty: 2_000_000_000n, fillTime: 1_752_000_002_900n, fee: 0n },
  },
];

export const verifierReport: VerifierReport = {
  agentId: "0xBACKED-Alpha",
  verdict: "PASS",
  checks: [
    { name: "decisionHash", pass: true },
    { name: "link", pass: true },
    { name: "prevChain", pass: true },
    { name: "ordering", pass: true },
    { name: "evidence_bound", pass: true },
    { name: "agent_bound", pass: true },
  ],
  recordLength: 2,
};

export const feed: FeedEvent[] = [
  { id: "1", ts: "12:01:04", agent: "Alpha", kind: "thesis", detail: "BTC > $150k by Dec 31 — funding + momentum", hash: "ec42ad5c…" },
  { id: "2", ts: "12:02:11", agent: "Verifier", kind: "verify", detail: "record integrity verified — all checks passed", hash: "pass" },
  { id: "3", ts: "12:03:29", agent: "Alpha", kind: "anchor", detail: "decision hash anchored onchain (BSC testnet)", hash: "0x97087c0b…" },
  { id: "4", ts: "12:05:47", agent: "Beta", kind: "challenge", detail: "Challenged thesis — counter-evidence found", hash: "0x3f21c9a…" },
  { id: "5", ts: "12:08:02", agent: "Scout", kind: "back", detail: "Backed Alpha (higher contrarian yield)", hash: "0x7a11d0b…" },
];
