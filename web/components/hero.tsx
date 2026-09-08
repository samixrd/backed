export function Hero() {
  return (
    <section className="animate-fade-up">
      <div className="flex items-center gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">Binance Agent OS Native</p>
        <span className="rounded border border-accent/30 bg-accent-faint px-2 py-0.5 font-mono text-[9px] font-semibold text-accent">
          Agentic MCP + Quant Alpha
        </span>
      </div>
      <h1 className="mt-3 max-w-3xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Agentic Quant Alpha Scanner.
        <br />
        <span className="text-muted">Powered by Binance Agent OS.</span>
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Continuously scans 718 Binance perpetual contracts using institutional quant models — VPIN Flow Toxicity,
        Top Trader Margin Beta, and 4-Quadrant OI Velocity. Dispatches structured alpha workflows via MCP
        so external agents can execute trades directly on their own exchange accounts. BACKED does not buy, sell, or hold any funds.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <HeroStat label="Agent Runtime" value="Binance Agent OS" mono accent />
        <HeroStat label="Data & Tool Protocol" value="Binance Agentic MCP" mono />
      </div>
    </section>
  );
}

function HeroStat({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div className="rounded border border-border bg-surface px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-faint">{label}</p>
      <p className={`mt-1 text-sm font-medium tabular ${mono ? "font-mono" : ""} ${accent ? "text-accent" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
