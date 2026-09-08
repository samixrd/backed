import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const spec = {
    openapi: "3.1.0",
    info: {
      title: "BACKED - 24/7 Binance Futures Market Intel & Alpha Oracle",
      version: "1.0.0",
      description:
        "24/7 Institutional Smart Money Intel, 718-contract Screener, Whale Trap Alerts, and Non-Custodial Trade Planning for Codex, Claude, Grok (xAI) & Hermes.",
    },
    servers: [{ url: baseUrl }],
    paths: {
      "/api/market/overview": {
        get: {
          summary: "24/7 Global Binance Futures Market Intelligence",
          operationId: "getMarketOverview",
          responses: {
            "200": { description: "Full market volume, open interest, fear & greed sentiment, and top surging contracts." },
          },
        },
      },
      "/api/screener": {
        get: {
          summary: "24/7 Screener Across All 718 Binance Perpetual Contracts",
          operationId: "getContractScreener",
          responses: {
            "200": { description: "Filtered and ranked perpetual contracts with institutional regimes and taker ratios." },
          },
        },
      },
      "/api/intel": {
        get: {
          summary: "Get Real-Time Smart Money Derivatives Intel for a Symbol",
          operationId: "getMarketIntel",
          parameters: [
            {
              name: "symbol",
              in: "query",
              required: false,
              schema: { type: "string", default: "BTCUSDT" },
              description: "Perpetual contract symbol e.g. BTCUSDT or SOLUSDT",
            },
          ],
          responses: {
            "200": { description: "Real-time derivatives snapshot and institutional regime." },
          },
        },
      },
      "/api/alpha/signals": {
        get: {
          summary: "Live Institutional Quant Alpha Signals (VPIN, Margin Beta, 4-Quadrant, Blueprints)",
          operationId: "getQuantAlphaSignals",
          responses: {
            "200": { description: "Scanned signals with VPIN, Margin Beta, 4-Quadrant Velocity State, risk blueprints, and workflows." },
          },
        },
      },
      "/api/trade/execute": {
        post: {
          summary: "Calculate Non-Custodial Intent Trade Parameters",
          operationId: "executeIntentTrade",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    symbol: { type: "string", example: "SOLUSDT" },
                    side: { type: "string", enum: ["BUY", "SELL"], default: "BUY" },
                    amountUsd: { type: "number", example: 50 },
                    strategyReasoning: { type: "string", example: "Smart money 70.4% Long" },
                  },
                  required: ["symbol", "side", "amountUsd"],
                },
              },
            },
          },
          responses: {
            "200": { description: "Non-custodial trade parameters, target, invalidation, expected value (+EV%), and execution blueprint." },
          },
        },
      },
      "/api/trade/close": {
        post: {
          summary: "Whale Trap Shield Front-Run Exit Signal",
          operationId: "smartExitWhaleShield",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    symbol: { type: "string", example: "SOLUSDT" },
                    side: { type: "string", enum: ["BUY", "SELL"], default: "BUY" },
                    entryPrice: { type: "number", example: 103.5 },
                    amountUsd: { type: "number", example: 5 },
                    reasonType: { type: "string", default: "whale_exhaustion" },
                  },
                  required: ["symbol"],
                },
              },
            },
          },
          responses: {
            "200": { description: "Non-custodial exit signal with realized PnL calculations and derisking blueprint." },
          },
        },
      },
    },
  };

  return NextResponse.json(spec);
}
