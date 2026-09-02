import { NextResponse } from "next/server";
import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// The core pipeline reads Azure/anchor/Supabase keys from the PARENT .env (D:\BACKED\.env).
// Next loads only web/.env by default, so bridge it here.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, "../../../../.env") });

import { runFundPipeline } from "@core/pipeline";
import { SupabaseStore } from "@core/store";

export const runtime = "nodejs";

// Runs the REAL BACKED pipeline: multi-source evidence → reasoning → decision → onchain anchor →
// Supabase persist. Returns the live record (not mock). No order placed (read-only demo).
export async function GET() {
  try {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const store = url && anonKey ? new SupabaseStore({ url, anonKey }) : undefined;

    const res = await runFundPipeline({
      agentId: process.env.AGENT_ID || "0xBACKED-Alpha",
      side: "BUY",
      qty: 10n ** 10n,
      store,
    });

    return NextResponse.json({
      ok: Boolean(res.ok),
      symbol: res.decision?.symbol ?? "BTCUSDT",
      side: res.decision?.side ?? "BUY",
      decisionHash: res.decisionHash,
      reasonHash: res.decision?.reasonHash ?? null,
      anchorTxHash: res.anchorTxHash ?? null,
      anchored: Boolean(res.anchored),
      stored: Boolean(res.stored),
      verified: Boolean(res.verification?.ok),
      reasoning: {
        provider: res.reasoningProvider ?? null,
        model: res.reasoningModel ?? null,
        label: res.reasoningLabel ?? null,
      },
      market: res.market ?? null,
      state: {
        reasoningMode: res.reasoningMode,
        reasoningProvider: res.reasoningProvider,
        reasoningModel: res.reasoningModel,
        evidenceSetHash: res.evidenceSetHash,
        decisionHash: res.decisionHash,
        reasonHash: res.decision?.reasonHash ?? null,
        anchorTxHash: res.anchorTxHash ?? null,
        anchored: Boolean(res.anchored),
        stored: Boolean(res.stored),
        verified: Boolean(res.verification?.ok),
      },
      error: res.ok ? null : `failed at step: ${res.step}`,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
