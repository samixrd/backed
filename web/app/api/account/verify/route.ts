import { NextResponse } from "next/server";
import crypto from "node:crypto";
import https from "node:https";

export const dynamic = "force-dynamic";

function httpsGetJson<T>(url: string, headers: Record<string, string> = {}): Promise<T | null> {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        hostname: parsed.hostname,
        port: 443,
        path: parsed.pathname + parsed.search,
        method: "GET",
        headers: { "User-Agent": "BACKED-Agent/1.0", ...headers },
        timeout: 7000,
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { apiKey, apiSecret, isTestnet = false } = body;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ ok: false, error: "Missing API Key or Secret" }, { status: 400 });
    }

    const host = isTestnet ? "testnet.binancefuture.com" : "fapi.binance.com";
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = crypto.createHmac("sha256", apiSecret).update(queryString).digest("hex");

    const fullUrl = `https://${host}/fapi/v1/account?${queryString}&signature=${signature}`;

    const res = await httpsGetJson<any>(fullUrl, {
      "X-MBX-APIKEY": apiKey,
    });

    if (!res || res.code) {
      return NextResponse.json({
        ok: false,
        error: res?.msg || "Invalid API Credentials or network error",
      }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      canTrade: res.canTrade,
      totalMarginBalance: res.totalMarginBalance || "0.00",
      availableBalance: res.availableBalance || "0.00",
      accountType: isTestnet ? "Binance Futures Testnet" : "Binance Futures Live",
      subAccountId: apiKey.slice(0, 6) + "..." + apiKey.slice(-4),
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
