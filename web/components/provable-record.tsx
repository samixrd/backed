import type { LedgerEntry, VerifierReport } from "@/lib/data";

export function ProvableRecord({ record }: { record: LedgerEntry[] }) {
  return (
    <section className="rounded border border-border bg-surface p-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.18em] text-faint">Provable record</p>
        <span className="font-mono text-[10px] text-faint">append-only · hash-chained</span>
      </div>

      <div className="mt-4 space-y-2">
        {record.map((e, i) => (
          <div key={i} className="rounded border border-border bg-surface-raised p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-medium text-foreground">
                #{e.link.index} · {e.decision.symbol}
              </span>
              <span className={`text-xs font-medium ${e.decision.side === "BUY" ? "text-success" : "text-danger"}`}>
                {e.decision.side}
              </span>
            </div>

            <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
              <Field label="decisionHash" value={e.link.dataHash} />
              <Field label="reasonHash" value={e.decision.reasonHash} ip />
              <Field label="link hash" value={e.link.h} />
              <Field label="anchorTxHash" value={e.anchorBlockTime ? `block ${e.anchorBlockTime}` : "—"} />
            </div>

            <div className="mt-2 flex items-center gap-2 text-[10px] text-faint">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
              <span>anchored before fill · no backdate</span>
              <span className="font-mono">anchor ≤ fill</span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[10px] text-faint">
        The reasonHash binds the agent's reasoning WITHOUT storing it — IP preserved. Changing any field
        breaks the chain, which a verifier catches.
      </p>
    </section>
  );
}

function Field({ label, value, ip }: { label: string; value: string; ip?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] uppercase tracking-[0.14em] text-faint">{label}</span>
      <span className={`font-mono text-[10px] tabular truncate ${ip ? "text-accent" : "text-muted"}`} title={value}>
        {value}
      </span>
    </div>
  );
}

export function VerificationPanel({ report, agentId }: { report: VerifierReport; agentId: string }) {
  const fails = report.checks.filter((c) => !c.pass).length;
  return (
    <section className="rounded border border-border bg-surface p-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.18em] text-faint">Verifier agent audit</p>
        <span className={`rounded px-2 py-0.5 text-[10px] font-semibold font-mono ${report.verdict === "PASS" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
          {report.verdict}
        </span>
      </div>

      <p className="mt-3 font-mono text-[11px] text-muted">
        audit of <span className="text-foreground">{agentId}</span> · {report.recordLength} entries ·{" "}
        {report.checks.length} checks
      </p>

      <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {report.checks.map((c) => (
          <div key={c.name} className="flex items-center gap-2 rounded border border-border bg-surface-raised px-2.5 py-1.5">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${c.pass ? "bg-success" : "bg-danger"}`} />
            <span className="font-mono text-[10px] text-muted">{c.name}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[10px] text-faint">
        {fails === 0
          ? "All checks passed — the record is verified authentic and unmodified."
          : `${fails} check(s) failed — the record is tampered or fabricated.`}
      </p>
    </section>
  );
}
