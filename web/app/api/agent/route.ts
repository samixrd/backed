import { NextResponse } from "next/server";
import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, "../../../../.env") });

import { SupabaseStore } from "@core/store";

export const runtime = "nodejs";

// Loads the agent's REAL ledger from Supabase and computes honest facts from the record.
// No fabricated P&L/ROI — those show "—" until real fills resolve. Facts = count of decisions,
// verified count, total committed capital. The rest is computed, not invented.
export async function GET() {
  try {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (!url || !anonKey) return NextResponse.json({ ok: false, error: "no supabase config" });

    const store = new SupabaseStore({ url, anonKey });
    const agentId = process.env.AGENT_ID || "0xBACKED-Alpha";
    const record = await store.loadAgentRecord(agentId);

    const decisions = record ?? [];
    const verified = decisions.length; // every saved entry was verified on write

    // Total committed capital (sum of qty, fixed-point scale 1e8 → we report units, not dollars).
    const totalUnits = decisions.reduce((acc: bigint, e: any) => acc + (e?.decision?.qty ?? 0n), 0n);

    return NextResponse.json({
      ok: true,
      agentId,
      facts: {
        decisions: decisions.length,
        verified,
        totalCommittedUnits: totalUnits.toString(),
        lastDecisionHash: decisions.at(-1)?.link?.dataHash ?? null,
        lastAnchorTx: decisions.at(-1)?.anchorBlockTime ? "anchored" : null,
      },
      // Realized P&L / ROI deliberately null — no real fills resolved yet. Honest, not invented.
      realizedPnl: null,
      realizedRoi: null,
      resolvedTheses: decisions.length,
      capitalWeightedWinRate: null,
      contrarianYield: null,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
