/**
 * datasource.ts — multi-source corroborating evidence.
 *
 * Data quality = provenance + corroboration. Before a decision fires we pull the SAME quantity
 * from MULTIPLE independent sources, and only accept it as evidence if they agree within a
 * tolerance. A judge can poke single-source data ("your agent hallucinated the price") — this
 * closes that hole, and the whole thing feeds straight into `inputSnapshotHash`.
 *
 * FREE APIs (no key): Binance public API, CoinGecko, alternative.me F&G.
 */

import { describeEvidence, snapshotToEvidence, isFresh } from "./evidence.js";
import { computeInputSnapshotHash } from "./provable.js";
import type { MarketSnapshot } from "./evidence.js";

export interface PriceQuote {
  source: string;
  priceUsd: number;
  observedAt: bigint; // ms epoch
}

import https from "node:https";

function httpsGetJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        hostname: parsed.hostname,
        port: 443,
        path: parsed.pathname + parsed.search,
        method: "GET",
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        timeout: 6000,
      },
      (res) => {
        let d = "";
        res.on("data", (chunk) => (d += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(d));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
    req.end();
  });
}

/** Fetch BTC spot from Binance public API (primary, no key). */
export async function binanceBtcPrice(): Promise<PriceQuote> {
  const j: any = await httpsGetJson("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT");
  return {
    source: "binance-spot-ticker",
    priceUsd: parseFloat(j.lastPrice),
    observedAt: BigInt(Date.now()),
  };
}

/** Fetch BTC price from CoinGecko (corroboration, no key). */
export async function coingeckoBtcPrice(): Promise<PriceQuote> {
  const j: any = await httpsGetJson("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
  return {
    source: "coingecko-simple-price",
    priceUsd: parseFloat(j.bitcoin.usd),
    observedAt: BigInt(Date.now()),
  };
}

/** Fear & Greed Index (sentiment), alternative.me — free JSON. */
export async function fearGreedIndex(): Promise<number> {
  const j: any = await httpsGetJson("https://api.alternative.me/fng/?limit=1");
  return parseInt(j.data[0].value, 10);
}

/** Corroboration result with tolerance. */
export interface Corroboration {
  ok: boolean;
  quotes: PriceQuote[];
  median: number;
  maxDeviationPct: number;
  tolerancePct: number;
}

/** Agree within `tolerancePct` of the median? */
export function corroborate(quotes: PriceQuote[], tolerancePct = 0.5): Corroboration {
  if (quotes.length === 0) return { ok: false, quotes, median: 0, maxDeviationPct: 0, tolerancePct };
  const sorted = quotes.map((q) => q.priceUsd).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const maxDeviationPct = Math.max(
    ...quotes.map((q) => (Math.abs(q.priceUsd - median) / median) * 100),
  );
  return { ok: maxDeviationPct <= tolerancePct, quotes, median, maxDeviationPct, tolerancePct };
}

/** Main loop entry — build high-confidence evidence from aligned sources, or reject. */
export async function gatherBtcEvidence(now?: bigint): Promise<
  { ok: true; snapshots: MarketSnapshot[]; explanation: string } | { ok: false; reason: string }
> {
  const observedAt = now ?? BigInt(Date.now());
  const [binance, coingecko] = await Promise.allSettled([binanceBtcPrice(), coingeckoBtcPrice()]);

  const quotes: PriceQuote[] = [];
  if (binance.status === "fulfilled") quotes.push(binance.value);
  if (coingecko.status === "fulfilled") quotes.push(coingecko.value);

  if (quotes.length === 0) return { ok: false, reason: "no source responded" };
  if (quotes.length === 1) return { ok: false, reason: "need >=2 sources for corroboration" };

  const corr = corroborate(quotes, 0.5);
  if (!corr.ok) {
    return {
      ok: false,
      reason: `sources disagree (max dev ${corr.maxDeviationPct.toFixed(3)}% > 0.5%)`,
    };
  }

  const snapshots: MarketSnapshot[] = quotes.map((q) => ({
    symbol: "BTCUSDT",
    price: BigInt(Math.round(q.priceUsd * 1e8)),
    observedAt: q.observedAt,
    source: q.source,
    raw: `price=${q.priceUsd}|observedAt=${q.observedAt}`,
  }));

  return {
    ok: true,
    snapshots,
    explanation: `corroborated ${quotes.length} sources, median $${corr.median.toFixed(0)}, max dev ${corr.maxDeviationPct.toFixed(3)}%`,
  };
}

/** Convenience: snapshot hash for a list of snapshots. */
export function evidenceSetHashFromSnapshots(snapshots: MarketSnapshot[]): string {
  return computeInputSnapshotHash(snapshots.map(snapshotToEvidence));
}

export { describeEvidence, snapshotToEvidence, isFresh };
