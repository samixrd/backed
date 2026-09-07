import { NextResponse } from "next/server";
import https from "node:https";

export const dynamic = "force-dynamic";

function httpsGetJson<T>(url: string): Promise<T | null> {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        hostname: parsed.hostname,
        port: 443,
        path: parsed.pathname + parsed.search,
        method: "GET",
        headers: { "User-Agent": "BACKED-Agent/1.0" },
        timeout: 6500,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            if (res.statusCode && res.statusCode >= 400) resolve(null);
            else resolve(JSON.parse(data));
          } catch {
            resolve(null);
          }
        });
      }
    );
    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
    req.end();
  });
}

function classifyRegime(longPct: number | null, takerRatio: number | null, fundingPct: number | null): string {
  if (longPct === null || takerRatio === null) return "Active Perp";
  if (longPct >= 60 && takerRatio >= 1.15) return "Smart Accum.";
  if (longPct >= 55 && takerRatio >= 1.0)  return "Mild Bullish";
  if (longPct >= 60 && takerRatio < 0.9)   return "Trapped Longs";
  if (longPct < 45 && takerRatio < 0.85)   return "Distribution";
  if (longPct < 48 && (fundingPct ?? 0) < 0) return "Squeeze Watch";
  return "Neutral";
}

// In-memory cache for ultra-fast response and rate-limit safety
let cachedResponse: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 10000; // 10 seconds

export async function GET() {
  const now = Date.now();
  if (cachedResponse && now - lastCacheTime < CACHE_TTL_MS) {
    return NextResponse.json(cachedResponse);
  }

  try {
    // 1. Ingest all 24hr tickers and all funding rates from Binance Futures
    const [tickers, premium] = await Promise.all([
      httpsGetJson<any[]>("https://fapi.binance.com/fapi/v1/ticker/24hr"),
      httpsGetJson<any[]>("https://fapi.binance.com/fapi/v1/premiumIndex"),
    ]);

    if (!Array.isArray(tickers)) {
      throw new Error("Unable to fetch Binance Futures tickers");
    }

    // Map funding rates from premiumIndex
    const fundingMap = new Map<string, number>();
    if (Array.isArray(premium)) {
      for (const p of premium) {
        if (p.symbol && p.lastFundingRate) {
          const fr = parseFloat(p.lastFundingRate);
          if (!isNaN(fr)) fundingMap.set(p.symbol, fr * 100);
        }
      }
    }

    // Filter valid USDT perpetual contracts and sort by 24h volume
    const usdtTickers = tickers
      .filter((t) => t.symbol && t.symbol.endsWith("USDT") && parseFloat(t.lastPrice ?? "0") > 0)
      .sort((a, b) => parseFloat(b.quoteVolume ?? "0") - parseFloat(a.quoteVolume ?? "0"));

    // Enrich top 50 coins by volume with deep institutional derivatives in parallel
    const TOP_ENRICH = 50;
    const topBatch = usdtTickers.slice(0, TOP_ENRICH);

    const [oiList, topRatioList, takerList] = await Promise.all([
      Promise.all(topBatch.map((t) => httpsGetJson<any>(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${t.symbol}`))),
      Promise.all(topBatch.map((t) => httpsGetJson<any[]>(`https://fapi.binance.com/futures/data/topLongShortAccountRatio?symbol=${t.symbol}&period=5m&limit=1`))),
      Promise.all(topBatch.map((t) => httpsGetJson<any[]>(`https://fapi.binance.com/futures/data/takerlongshortRatio?symbol=${t.symbol}&period=5m&limit=1`))),
    ]);

    // Build enriched lookup map
    const enrichedMap = new Map<string, {
      oiUsd: number | null;
      longPct: number | null;
      shortPct: number | null;
      takerRatio: number | null;
      takerBuyUsd: number | null;
      takerSellUsd: number | null;
      regime: string;
    }>();

    for (let i = 0; i < topBatch.length; i++) {
      const sym = topBatch[i].symbol;
      const price = parseFloat(topBatch[i].lastPrice ?? "0");

      let oiUsd: number | null = null;
      if (oiList[i] && oiList[i].openInterest) {
        const oiQty = parseFloat(oiList[i].openInterest);
        if (!isNaN(oiQty)) oiUsd = Math.round(oiQty * price);
      }

      let longPct: number | null = null;
      let shortPct: number | null = null;
      const ratioItem = topRatioList[i];
      if (Array.isArray(ratioItem) && ratioItem.length > 0 && ratioItem[0]) {
        const la = parseFloat(ratioItem[0].longAccount);
        const sa = parseFloat(ratioItem[0].shortAccount);
        if (!isNaN(la) && la > 0) {
          longPct = Number((la * 100).toFixed(1));
          shortPct = Number((sa * 100).toFixed(1));
        }
      }

      let takerRatio: number | null = null;
      let takerBuyUsd: number | null = null;
      let takerSellUsd: number | null = null;
      const takerItem = takerList[i];
      if (Array.isArray(takerItem) && takerItem.length > 0 && takerItem[0]) {
        const r = parseFloat(takerItem[0].buySellRatio);
        const bq = parseFloat(takerItem[0].buyVol);
        const sq = parseFloat(takerItem[0].sellVol);
        if (!isNaN(r) && r > 0) {
          takerRatio = Number(r.toFixed(3));
          takerBuyUsd = Math.round(bq * price);
          takerSellUsd = Math.round(sq * price);
        }
      }

      const fund = fundingMap.get(sym) ?? null;
      const regime = classifyRegime(longPct, takerRatio, fund);

      enrichedMap.set(sym, {
        oiUsd,
        longPct,
        shortPct,
        takerRatio,
        takerBuyUsd,
        takerSellUsd,
        regime,
      });
    }

    // Build the master asset list across all 700+ contracts
    let totalMarketVolume = 0;
    let totalKnownOI = 0;
    let totalGainers = 0;
    let totalLosers = 0;

    const assets = usdtTickers.map((t, idx) => {
      const sym = t.symbol;
      const price = parseFloat(t.lastPrice ?? "0");
      const priceChange24h = parseFloat(t.priceChangePercent ?? "0");
      const volume24hUsd = Math.round(parseFloat(t.quoteVolume ?? "0"));
      const tradesCount = parseInt(t.count ?? "0", 10);
      const high24h = parseFloat(t.highPrice ?? "0");
      const low24h = parseFloat(t.lowPrice ?? "0");
      const fundingPct = fundingMap.has(sym) ? Number((fundingMap.get(sym)!).toFixed(4)) : null;

      totalMarketVolume += volume24hUsd;
      if (priceChange24h > 0) totalGainers++;
      else if (priceChange24h < 0) totalLosers++;

      const enriched = enrichedMap.get(sym);
      if (enriched?.oiUsd) {
        totalKnownOI += enriched.oiUsd;
      }

      return {
        rank: idx + 1,
        symbol: sym,
        base: sym.replace("USDT", ""),
        price: Number(price.toFixed(price >= 100 ? 2 : price >= 1 ? 4 : 6)),
        priceChange24h: Number(priceChange24h.toFixed(2)),
        volume24hUsd,
        tradesCount,
        high24h: Number(high24h.toFixed(high24h >= 100 ? 2 : 4)),
        low24h: Number(low24h.toFixed(low24h >= 100 ? 2 : 4)),
        openInterestUsd: enriched?.oiUsd ?? null,
        longPct: enriched?.longPct ?? null,
        shortPct: enriched?.shortPct ?? null,
        takerRatio: enriched?.takerRatio ?? null,
        takerBuyUsd: enriched?.takerBuyUsd ?? null,
        takerSellUsd: enriched?.takerSellUsd ?? null,
        fundingPct,
        regime: enriched?.regime ?? "Active Perp",
        isEnriched: !!enriched,
      };
    });

    const enrichedAssets = assets.filter((a) => a.isEnriched);
    const bullishCount = enrichedAssets.filter((a) => (a.longPct ?? 50) >= 55 && (a.takerRatio ?? 1) >= 1.0).length;

    const payload = {
      ok: true,
      totalAssetsCount: assets.length,
      enrichedCount: enrichedAssets.length,
      assets,
      aggregate: {
        totalMarketVolumeUsd: totalMarketVolume,
        totalEnrichedOIUsd: totalKnownOI,
        totalGainers,
        totalLosers,
        bullishCount,
        bearishCount: enrichedAssets.length - bullishCount,
      },
      dataSource: "Binance Futures Engine (fapi.binance.com)",
      observedAt: Date.now(),
    };

    cachedResponse = payload;
    lastCacheTime = Date.now();

    return NextResponse.json(payload);
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
