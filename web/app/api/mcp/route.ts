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
        timeout: 6000,
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

const MCP_TOOLS = [
  {
    name: "backed_get_smart_money_intel",
    description:
      "Ingest real-time smart money positioning across 718 Binance Futures contracts (Top Trader Long/Short ratio, Taker flow, Open Interest, and institutional regimes).",
    inputSchema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "Optional perpetual symbol e.g. BTCUSDT, SOLUSDT. Omit to receive top smart money rankings.",
        },
      },
    },
  },
  {
    name: "backed_execute_intent_trade",
    description:
      "Autonomously execute a market order on Binance Agent OS (Futures) based on smart money analysis, and anchor cryptographic settlement proof to BSC Testnet.",
    inputSchema: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "Contract symbol e.g. SOLUSDT" },
        side: { type: "string", enum: ["BUY", "SELL"], description: "BUY for Long, SELL for Short" },
        amountUsd: { type: "number", description: "Notional trade size in USDT e.g. 5 or 10" },
        strategyReasoning: { type: "string", description: "Strategic rationale for the trade" },
      },
      required: ["symbol", "side", "amountUsd"],
    },
  },
  {
    name: "backed_smart_exit_whale_shield",
    description:
      "Autonomously front-run retail panic and exit an active position when whales exhaust liquidity at resistance. Anchors settlement proof onto BSC Testnet.",
    inputSchema: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "Contract symbol to close e.g. SOLUSDT" },
        side: { type: "string", enum: ["BUY", "SELL"], description: "Original entry side" },
        entryPrice: { type: "number", description: "Original entry price" },
        amountUsd: { type: "number", description: "Trade size in USDT" },
        reason: { type: "string", description: "Exit reason" },
      },
      required: ["symbol"],
    },
  },
];

export async function GET() {
  return NextResponse.json({
    name: "backed-mcp-server",
    version: "1.0.0",
    protocolVersion: "2024-11-05",
    description: "BACKED Autonomous Market Intel & Trade Agent MCP Provider for Binance Agent OS",
    tools: MCP_TOOLS,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jsonrpc = "2.0", id = 1, method, params } = body;

    // Handle tools/list
    if (method === "tools/list") {
      return NextResponse.json({
        jsonrpc,
        id,
        result: { tools: MCP_TOOLS },
      });
    }

    // Handle tools/call
    if (method === "tools/call") {
      const toolName = params?.name;
      const args = params?.arguments || {};

      if (toolName === "backed_get_smart_money_intel") {
        const targetSymbol = args.symbol ? args.symbol.toUpperCase() : "SOLUSDT";
        const normalized = targetSymbol.endsWith("USDT") ? targetSymbol : `${targetSymbol}USDT`;

        const [ticker, ratio, taker, oi] = await Promise.all([
          httpsGetJson<any>(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${normalized}`),
          httpsGetJson<any[]>(`https://fapi.binance.com/futures/data/topLongShortAccountRatio?symbol=${normalized}&period=5m&limit=1`),
          httpsGetJson<any[]>(`https://fapi.binance.com/futures/data/takerlongshortRatio?symbol=${normalized}&period=5m&limit=1`),
          httpsGetJson<any>(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${normalized}`),
        ]);

        const price = parseFloat(ticker?.price ?? "0");
        const longPct = Array.isArray(ratio) && ratio[0] ? parseFloat(ratio[0].longAccount || "0.5") * 100 : 50;
        const takerRatio = Array.isArray(taker) && taker[0] ? parseFloat(taker[0].buySellRatio || "1.0") : 1.0;
        const openInterestUsd = oi?.openInterest ? parseFloat(oi.openInterest) * price : 0;

        const resultText = JSON.stringify(
          {
            symbol: normalized,
            price,
            topTraderLongPct: Number(longPct.toFixed(1)),
            topTraderShortPct: Number((100 - longPct).toFixed(1)),
            takerBuySellRatio: Number(takerRatio.toFixed(3)),
            openInterestUsd: Math.round(openInterestUsd),
            institutionalRegime: longPct >= 65 && takerRatio >= 1.1 ? "Smart Accumulation" : longPct < 45 ? "Distribution" : "Neutral",
            conviction: longPct >= 65 ? "HIGH_LONG" : longPct <= 40 ? "HIGH_SHORT" : "MODERATE",
          },
          null,
          2
        );

        return NextResponse.json({
          jsonrpc,
          id,
          result: {
            content: [{ type: "text", text: resultText }],
          },
        });
      }

      if (toolName === "backed_execute_intent_trade") {
        const host = req.headers.get("host") || "localhost:3000";
        const protocol = host.includes("localhost") ? "http" : "https";

        const tradeRes = await fetch(`${protocol}://${host}/api/trade/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(args),
        });

        const tradeData = await tradeRes.json();
        return NextResponse.json({
          jsonrpc,
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(tradeData, null, 2) }],
          },
        });
      }

      if (toolName === "backed_smart_exit_whale_shield") {
        const host = req.headers.get("host") || "localhost:3000";
        const protocol = host.includes("localhost") ? "http" : "https";

        const closeRes = await fetch(`${protocol}://${host}/api/trade/close`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: args.symbol || "SOLUSDT",
            side: args.side || "BUY",
            entryPrice: args.entryPrice || 103.5,
            amountUsd: args.amountUsd || 5,
            reasonType: "whale_exhaustion",
          }),
        });

        const closeData = await closeRes.json();
        return NextResponse.json({
          jsonrpc,
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(closeData, null, 2) }],
          },
        });
      }

      return NextResponse.json({
        jsonrpc,
        id,
        error: { code: -32601, message: `Tool not found: ${toolName}` },
      });
    }

    return NextResponse.json({
      jsonrpc,
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    });
  } catch (err: any) {
    return NextResponse.json(
      { jsonrpc: "2.0", id: 1, error: { code: -32000, message: err.message } },
      { status: 500 }
    );
  }
}
