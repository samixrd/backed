"use client";

import { useCallback, useEffect, useState } from "react";

// Polls the live BACKED pipeline (/api/run) and renders the REAL provable record — no mock data.
export function SmartRecord() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/run");
      const j = await r.json();
      setData(j);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) return <div className="p-5 text-muted">Loading live record…</div>;

  if (!data?.ok) {
    return (
      <div className="rounded border border-border bg-surface p-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-faint">Live record</p>
        <p className="mt-2 text-sm text-muted">Pipeline unavailable{data?.error ? ` (${data.error})` : ""}.</p>
      </div>
    );
  }

  const s = data.state;
  return (
    <div className="rounded border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-faint">
          Live provable record
        </p>
        <button onClick={load} className="focus-ring rounded bg-accent-faint px-2 py-1 text-[10px] font-semibold text-accent">
          {loading ? "Running…" : "Run again"}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="rounded border border-border bg-surface-raised px-2 py-0.5 font-mono text-[10px] text-muted">{s.reasoningProvider ?? "—"}</span>
        <span className="rounded border border-border bg-surface-raised px-2 py-0.5 font-mono text-[10px] text-muted">{s.reasoningModel ?? "—"}</span>
        {s.verified && <span className="rounded bg-success/10 px-2 py-0.5 font-mono text-[10px] text-success">VERIFIED</span>}
        {!s.verified && s.anchored && <span className="rounded bg-accent-faint px-2 py-0.5 font-mono text-[10px] text-accent">PENDING</span>}
      </div>
      <dl className="mt-3 space-y-1.5 font-mono text-xs">
        <Row k="symbol" v={data.symbol} />
        <Row k="side" v={data.side} />
        <Row k="decisionHash" v={s.decisionHash} />
        <Row k="reasonHash" v={s.reasonHash} />
        <Row k="evidenceSetHash" v={s.evidenceSetHash} />
        <Row k="anchorTxHash" v={s.anchorTxHash} />
        <Row k="anchored" v={String(s.anchored)} />
        <Row k="stored" v={String(s.stored)} />
        <Row k="verified" v={String(s.verified)} />
      </dl>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-faint">{k}</dt>
      <dd className="max-w-[60%] break-all text-right text-muted">{v ?? "—"}</dd>
    </div>
  );
}
