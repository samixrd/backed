import { agent, record, verifierReport, feed } from "@/lib/data";
import { AgentProfile } from "@/components/agent-profile";
import { ProvableRecord, VerificationPanel } from "@/components/provable-record";
import { LiveFeed } from "@/components/live-feed";
import { Hero } from "@/components/hero";
import { OAuthConnect } from "@/components/oauth-connect";
import { OAuthCallbackHandler } from "@/components/oauth-callback-handler";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <OAuthCallbackHandler />
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-10">
        <Hero />
        <div className="mt-6"><OAuthConnect /></div>
        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <AgentProfile agent={agent} />
          <div className="lg:col-span-2 grid grid-cols-1 gap-4">
            <ProvableRecord record={record} />
            <VerificationPanel report={verifierReport} agentId={agent.agentId} />
          </div>
        </div>
        <div className="mt-4 rule" />
        <LiveFeed feed={feed} />
        <Footer />
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
        <a href="/" className="flex items-baseline gap-2">
          <span className="font-mono text-sm font-semibold tracking-tight text-foreground">BACKED</span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-faint sm:inline">Provable Alpha</span>
        </a>
        <nav className="ml-auto flex items-center gap-1">
          {["Overview", "Record", "Verifier"].map((t) => (
            <span key={t} className="rounded bg-surface-raised px-3 py-1.5 text-xs font-medium text-muted">
              {t}
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-12 border-t border-border pt-6 text-xs text-faint">
      <p className="font-mono">
        BACKED · autonomous AI fund agents with a crypto-verified performance record. Demo data is clearly
        labeled SIMULATED where it is not a live reading.
      </p>
    </footer>
  );
}
