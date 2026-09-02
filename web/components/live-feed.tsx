import type { FeedEvent } from "@/lib/data";

const KIND_LABEL: Record<FeedEvent["kind"], string> = {
  thesis: "Thesis",
  back: "Backed",
  challenge: "Challenge",
  anchor: "Anchor",
  resolve: "Resolve",
  verify: "Verify",
};

export function LiveFeed({ feed }: { feed: FeedEvent[] }) {
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
        {feed.map((e) => (
          <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className="font-mono text-[10px] tabular text-faint">{e.ts}</span>
            <span className="w-20 shrink-0 rounded bg-surface-raised px-1.5 py-0.5 text-center text-[9px] font-medium uppercase tracking-[0.12em] text-muted">
              {KIND_LABEL[e.kind]}
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
