/**
 * trader.ts — Binance trading adapter (real signed HTTP, no OAuth-in-client bottleneck).
 *
 * This is the genuine "agent touches Binance" execution path. The Binance Agentic MCP server is
 * OAuth-bound to a connected AI client (Claude Code / Codex / ChatGPT / VS Code) with a manually
 * funded sub-account + confirm-before-execute; a standalone agent service cannot call it directly.
 *
 * So we use Binance's REST APIs directly:
 *   - Market data : public, no key (already in datasource.ts).
 *   - Execution   : BINANCE TESTNET signed API keys (free from testnet.binance.vision, ~1 min).
 *                   Signed requests = deterministic, autonomous, real order lifecycle.
 *
 * Keys come from env: BINANCE_TESTNET_API_KEY + BINANCE_TESTNET_API_SECRET (spot testnet).
 * Product uses testnet by default (no real funds). A real order is only placed if `live: true` is
 * passed AND keys are present; otherwise we return the signed-order payload as a dry-run demo
 * (never fabricate an order id).
 */

import { createHmac } from "node:crypto";

export const BINANCE = {
  "testnet": { rest: "https://testnet.binance.vision", ws: "wss://stream.testnet.binance.vision/ws" },
  "mainnet": { rest: "https://api.binance.com", ws: "wss://stream.binance.com:9443/ws" },
} as const;

export interface TraderConfig {
  mode: "testnet" | "mainnet";
  apiKey: string;
  apiSecret: string;
  // If false, we compute the signed payload + signature but DO NOT broadcast (dry-run demo).
  live?: boolean;
}

export interface OrderResult {
  placed: boolean;
  symbol?: string;
  side?: "BUY" | "SELL";
  quantity?: string;
  orderId?: string;
  status?: string;
  fills?: { price: string; qty: string; time?: number }[];
  decisionHash?: string;
  /** The signed payload + signature, so a verifier can confirm the order was genuinely produced. */
  signedRequest?: { url: string; body: string };
  note?: string;
}

function sign(query: string, secret: string): string {
  return createHmac("sha256", secret).update(query).digest("hex");
}

/** Build a signed MARKET order request (no broadcast unless live). */
export async function placeMarketOrder(
  cfg: TraderConfig,
  order: { symbol: string; side: "BUY" | "SELL"; quantity: string; decisionHash?: string },
): Promise<OrderResult> {
  const rest = BINANCE[cfg.mode].rest;
  const now = Date.now();
  const params = new URLSearchParams({
    symbol: order.symbol,
    side: order.side,
    type: "MARKET",
    quantity: order.quantity,
    timestamp: String(now),
    recvWindow: "10000",
  });
  const query = params.toString();
  const signature = sign(query, cfg.apiSecret);
  const url = `${rest}/api/v3/order?${query}&signature=${signature}`;
  // The body we WOULD send (POST) — kept for the verifier to confirm the request was authentic.
  const signedRequest = { url, body: JSON.stringify({ symbol: order.symbol, side: order.side, type: "MARKET", quantity: order.quantity }) };

  if (!cfg.live) {
    return {
      placed: false,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      decisionHash: order.decisionHash,
      signedRequest,
      note: "DRY-RUN: signed payload computed, order NOT sent. Set live:true + funded testnet keys to broadcast.",
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "X-MBX-APIKEY": cfg.apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`order ${res.status}: ${text}`);
  const j: any = JSON.parse(text);
  return {
    placed: true,
    symbol: j.symbol,
    side: j.side,
    quantity: j.executedQty ?? j.origQty,
    orderId: j.orderId,
    status: j.status,
    fills: Array.isArray(j.fills) ? j.fills : [],
    decisionHash: order.decisionHash,
    signedRequest,
  };
}

/** Check available testnet funds (spot) for a symbol. */
export async function testnetBalances(cfg: TraderConfig, asset = "USDT"): Promise<{ asset: string; free: string }> {
  const rest = BINANCE[cfg.mode].rest;
  const query = `timestamp=${Date.now()}&recvWindow=10000`;
  const signature = sign(query, cfg.apiSecret);
  const res = await fetch(`${rest}/api/v3/account?${query}&signature=${signature}`, {
    headers: { "X-MBX-APIKEY": cfg.apiKey },
  });
  const j: any = await res.json();
  const bal = (j.balances ?? []).find((b: any) => b.asset === asset);
  return { asset, free: bal?.free ?? "0" };
}
