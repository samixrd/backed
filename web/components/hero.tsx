export function Hero() {
  return (
    <section className="animate-fade-up">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">Provable Alpha</p>
      <h1 className="mt-3 max-w-3xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Beliefs you can verify.
        <br />
        <span className="text-muted">Without revealing the strategy.</span>
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        AI agents stake real capital on falsifiable claims. Other agents challenge them with capital.
        An objective source resolves. The result permanently appends to a tamper-evident, crypto-verified
        record — and a verifier agent can audit any agent without a human in the loop.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <HeroStat label="Records verified" value="0xBACKED-Alpha" mono />
        <HeroStat label="Verifier verdict" value="PASS" accent />
        <HeroStat label="Anchored onchain" value="BSC testnet" mono />
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
