"use client";

import { useEffect, useState } from "react";

// Live agent activity: built from real pipeline facts (/api/run + /api/agent), not mock feed.
export function LiveFeed() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const [run, ag] = await Promise.all([
          fetch("/api/run").then((r) => r.json()),
          fetch("/api/agent").then((r) => r.json()),
        ]);
        if (!on) return;
        const list: any[] = [];
        if (run?.ok) {
          const t = new Date().toLocaleTimeString("en-GB", { hour12: false }).slice(0, 8);
          list.push({ id: "run", ts: t, kind: "verify", agent: "Alpha", detail: `verified ${run.symbol} ${run.side} — ${run.reasoning?.model ?? "model"}`, hash: run.anchorTxHash?.slice(0, 8) ?? "—" });
          if (run.anchorTxHash) list.push({ id: "anchor", ts: t, kind: "anchor", agent: "Alpha", detail: "decision hash anchored onchain (timestamp proof)", hash: run.anchorTxHash.slice(0, 8) });
          if (run.market?.quotes?.length) list.push({ id: "risk", ts: t, kind: "challenge", agent: "Risk", detail: `corroborated ${run.market.quotes.length} sources, dev ${run.market.maxDeviationPct}%`, hash: "—" });
        }
        if (ag?.ok && ag.facts?.decisions > 0) {
          const t = new Date().toLocaleTimeString("en-GB", { hour12: false }).slice(0, 8);
          list.push({ id: "agent", ts: t, kind: "resolve", agent: "Alpha", detail: `${ag.facts.decisions} commits, ${ag.facts.verified} verified onchain`, hash: ag.facts.lastDecisionHash?.slice(0, 8) ?? "—" });
        }
        setEvents(list);
      } catch {
        if (on) setEvents([]);
      }
    })();
    return () => { on = false; };
  }, []);

  if (events.length === 0) {
    return (
      <section className="animate-fade-up">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.18em] text-faint">Live agent activity</p>
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-faint">live</span>
        </div>
        <p className="mt-3 text-xs text-muted">Loading live activity…</p>
      </section>
    );
  }

  return (
    <section className="animate-fade-up">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.18em] text-faint">Live agent activity</p>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-faint">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          live
        </span>
      </div>

      <div className="mt-3 divide-y divide-border rounded border border-border bg-surface">
        {events.map((e) => (
          <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className="font-mono text-[10px] tabular text-faint">{e.ts}</span>
            <span className="w-20 shrink-0 rounded bg-surface-raised px-1.5 py-0.5 text-center text-[9px] font-medium uppercase tracking-[0.12em] text-muted">
              {e.kind}
            </span>
            <span className="font-mono text-xs text-foreground">{e.agent}</span>
            <span className="flex-1 truncate text-xs text-muted">{e.detail}</span>
            <span className="hidden font-mono text-[10px] text-faint sm:inline">{e.hash}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
