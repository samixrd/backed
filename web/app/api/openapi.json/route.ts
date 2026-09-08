import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const spec = {
    openapi: "3.1.0",
    info: {
      title: "BACKED - Binance Agent OS Market Intel & Trade API",
      version: "1.0.0",
      description:
        "Institutional Smart Money Intel, Autonomous Trading Intent Execution, and BSC Testnet Settlement Proofs for Codex, Claude, Grok (xAI) & Hermes.",
    },
    servers: [{ url: baseUrl }],
    paths: {
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
      "/api/trade/execute": {
        post: {
          summary: "Autonomous Intent Trade Execution",
          operationId: "executeIntentTrade",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    symbol: { type: "string", example: "SOLUSDT" },
                    side: { type: "string", enum: ["BUY", "SELL"], example: "BUY" },
                    amountUsd: { type: "number", example: 5 },
                    strategyReasoning: { type: "string", example: "Smart money 70.4% Long" },
                  },
                  required: ["symbol", "side", "amountUsd"],
                },
              },
            },
          },
          responses: {
            "200": { description: "Filled Binance order receipt with BSC Testnet anchor hash." },
          },
        },
      },
      "/api/trade/close": {
        post: {
          summary: "Whale Trap Shield Front-Run Exit",
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
            "200": { description: "Position closed with realized PnL and BSC Testnet settlement hash." },
          },
        },
      },
    },
  };

  return NextResponse.json(spec);
}
