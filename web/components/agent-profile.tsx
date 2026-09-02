"use client";

import { useEffect, useState } from "react";
import type { AgentProfile as AgentProfileType } from "@/lib/data";

// Live agent profile: pulls real facts from Supabase (/api/agent). P&L/ROI are null until real
// fills resolve — displayed as "—" rather than invented. This is the honest data path.
export function AgentProfile({ agent }: { agent: AgentProfileType }) {
  const [facts, setFacts] = useState<any>(null);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const r = await fetch("/api/agent");
        const j = await r.json();
        if (on && j.ok) setFacts(j.facts);
      } catch {
        if (on) setFacts(null);
      }
    })();
    return () => { on = false; };
  }, []);

  const d = facts?.decisions ?? 0;
  const verified = facts?.verified ?? 0;

  return (
    <section className="rounded border border-border bg-surface p-5 animate-fade-up">
      <div className="flex items-center gap-2">
        <p className="text-[10px] uppercase tracking-[0.18em] text-accent">Alpha</p>
        <span className="rounded border border-border bg-surface-raised px-1.5 py-0.5 font-mono text-[9px] text-muted">
          {facts ? (facts.decisions > 0 ? "LIVE" : "IDLE") : "LOADING"}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <Stat label="Realized P&L" value={facts && facts.realizedPnl != null ? facts.realizedPnl : "—"} big accent />
        <Stat label="Resolved theses" value={String(d)} big />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        <MetricRow label="Verified records" value={String(verified)} />
        <MetricRow label="Capital committed (units)" value={facts ? (BigInt(facts.totalCommittedUnits ?? 0) / 100000000n).toString() : "—"} />
        <MetricRow label="Realized ROI" value={facts && facts.realizedRoi != null ? `+${(facts.realizedRoi * 100).toFixed(1)}%` : "—"} />
        <MetricRow label="Contrarian yield" value={facts && facts.contrarianYield != null ? String(facts.contrarianYield) : "—"} />
      </div>
      <div className="mt-4 border-t border-border pt-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-faint">Live positions</p>
        <p className="mt-1 font-mono text-xs text-muted">
          {facts?.decisions ? `BUY ${String(facts.decisions)} commit${facts.decisions > 1 ? "s" : ""} · every decision onchain-anchored` : "Awaiting first decision…"}
        </p>
      </div>
    </section>
  );
}

function Stat({ label, value, big, accent }: { label: string; value: string; big?: boolean; accent?: boolean }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.18em] text-faint">{label}</p>
      <p className={`font-mono ${accent ? "text-accent" : "text-foreground"} ${big ? "text-2xl" : "text-sm"}`}>{value}</p>
    </div>
  );
}

function MetricRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between border-t border-border/50 pt-1.5">
      <span className="text-[10px] text-faint">{label}</span>
      <span className={`font-mono text-xs ${accent ? "text-accent" : "text-foreground"}`}>{value}</span>
    </div>
  );
}
