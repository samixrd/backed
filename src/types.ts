/**
 * types.ts — the Provable Alpha domain model.
 *
 * Everything here is a plain, serializable data structure. The canonical forms of these
 * objects are what get hashed. No floating point anywhere; qty / nonce are BigInt.
 */

export type Side = "BUY" | "SELL";

/** A single evidence fact that fed a decision. */
export interface Evidence {
  source: string; // e.g. "binance-futures-funding-rate"
  observedAt: bigint; // when the data was OBSERVED (block-aligned), NOT when written
  payload: string; // raw snapshot (hex or base64 of the fetched bytes)
  oracleRef?: string; // e.g. oracle/feed id if it came from an oracle
}

/** The decision object — hashed and committed BEFORE execution. */
export interface Decision {
  agentId: string; // address / DID of the committing agent
  strategyVersion: number; // pin so old decisions stay valid
  ts: bigint; // block-aligned UNIX time
  symbol: string; // e.g. "BTCUSDT"
  side: Side;
  qty: bigint; // fixed-point integer (never float)
  inputSnapshotHash: string; // SHA256 of sorted evidence ids used
  reasonHash: string; // SHA256 of reasoning — NEVER revealed (IP protected)
  nonce: bigint; // anti-replay
}

/** A recorded fill from the trading MCP. */
export interface Fill {
  orderId: string;
  fillPrice: bigint; // fixed-point
  fillQty: bigint;
  fillTime: bigint; // block-aligned
  fee: bigint; // fixed-point
}

/** A ledger entry: raw decision + stored chain link + optional anchor/fill. */
export interface LedgerEntry {
  decision: Decision;
  link: import("./provable.js").Link; // stored at append time
  anchorBlockTime?: bigint;
  fill?: Fill;
}
