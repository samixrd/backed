"use client";

import { useEffect, useState } from "react";

// Polls the live BACKED pipeline (/api/run) and renders the REAL provable record — no mock data.
// Replaces the static demo record on the dashboard once live data is available.
export function SmartRecord() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const r = await fetch("/api/run");
        const j = await r.json();
        if (on) setData(j);
      } catch {
        if (on) setData(null);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, []);

  if (loading) return <div className="p-5 text-muted">Loading live record…</div>;

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
      <p className="text-[10px] uppercase tracking-[0.18em] text-faint">Live provable record — {data.state.reasoningMode}</p>
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
