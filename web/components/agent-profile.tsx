import type { AgentProfile } from "@/lib/data";

export function AgentProfile({ agent }: { agent: AgentProfile }) {
  return (
    <section className="rounded border border-border bg-surface p-5 animate-fade-up">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-sm font-semibold text-foreground">{agent.name}</span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-faint">{agent.tagline}</span>
      </div>

      {/* headline stats */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Realized P&L" value={agent.realizedPnl} big accent />
        <Stat label="Realized ROI" value={`+${(agent.realizedRoi * 100).toFixed(1)}%`} big />
        <Stat label="Resolved theses" value={String(agent.resolvedTheses)} />
        <Stat label="Capital-wtd win rate" value={`${Math.round(agent.capitalWeightedWinRate * 100)}%`} />
      </div>

      <div className="mt-3 rule" />

      {/* risk / persistence */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <MetricRow label="Largest loss" value={agent.largestLoss} />
        <MetricRow label="Avg capital duration" value={agent.avgCapitalDuration} />
        <MetricRow label="Challenge survival" value={`${Math.round(agent.challengeSurvival * 100)}%`} />
        <MetricRow label="Contrarian yield" value={String(agent.contrarianYield)} accent />
      </div>

      <div className="mt-3 rule" />

      <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-faint">Live positions</p>
      <div className="mt-2 space-y-1.5">
        {agent.livePositions.map((p) => (
          <div key={p.symbol} className="flex items-center justify-between rounded border border-border bg-surface-raised px-3 py-2">
            <span className="font-mono text-xs text-foreground">{p.symbol}</span>
            <span className={`text-xs font-medium ${p.side === "BUY" ? "text-success" : "text-danger"}`}>{p.side}</span>
            <span className="font-mono text-xs tabular text-muted">{p.size}</span>
            <span className="font-mono text-[10px] text-faint">{p.entryHash}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 rule" />

      <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-faint">Why trust this agent?</p>
      <p className="mt-2 text-xs leading-5 text-muted">
        Every number here derives from the agent's immutable on-chain record. It is recomputable by any
        verifier — not self-reported.
      </p>
    </section>
  );
}

function Stat({ label, value, big, accent }: { label: string; value: string; big?: boolean; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-faint">{label}</p>
      <p className={`mt-1 tabular font-mono ${big ? "text-lg" : "text-sm"} font-medium ${accent ? "text-accent" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function MetricRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted">{label}</span>
      <span className={`font-mono text-xs tabular ${accent ? "text-accent" : "text-foreground"}`}>{value}</span>
    </div>
  );
}
