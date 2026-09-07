"use client";

import { useState, useEffect } from "react";
import { Hero } from "@/components/hero";
import { TokenScreener } from "@/components/token-screener";
import { SmartMoney } from "@/components/smart-money";
import { MarketOverview } from "@/components/market-overview";
import { MarketIntelSection } from "@/components/market-intel-section";
import { CopilotTerminal } from "@/components/copilot-terminal";
import { LiveSignalStream } from "@/components/live-signal-stream";
import { ConnectModal, useAgentSession } from "@/components/connect-modal";
import { McpIntegrateModal } from "@/components/mcp-integrate-modal";

const TABS = [
  { id: "overview",  label: "Market Overview",  desc: "Macro volume, OI & 700+ breadth" },
  { id: "screener",  label: "Token Screener",    desc: "718 Live Binance Perps" },
  { id: "smart",     label: "Smart Money",       desc: "Top institutional positioning & bias" },
  { id: "intel",     label: "AI Alpha & Anchor", desc: "AI synthesis + onchain anchoring" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Home() {
  const [tab, setTab] = useState<TabId>("overview");
  const [connectOpen, setConnectOpen] = useState(false);
  const [mcpOpen, setMcpOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setConnectOpen(true);
    window.addEventListener("backed:open-connect", handleOpen);
    return () => window.removeEventListener("backed:open-connect", handleOpen);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        onOpenConnect={() => setConnectOpen(true)}
        onOpenMcp={() => setMcpOpen(true)}
      />
      <ConnectModal isOpen={connectOpen} onClose={() => setConnectOpen(false)} />
      <McpIntegrateModal isOpen={mcpOpen} onClose={() => setMcpOpen(false)} />
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-10 space-y-8">
        <Hero />

        {/* Tab bar */}
        <div className="border-b border-border">
          <nav className="-mb-px flex gap-0 overflow-x-auto">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`group flex shrink-0 flex-col gap-0.5 border-b-2 px-5 pb-3 pt-2 transition-colors ${
                    active
                      ? "border-accent text-accent"
                      : "border-transparent text-muted hover:border-border hover:text-foreground"
                  }`}
                >
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                    {t.label}
                  </span>
                  <span className="font-mono text-[9px] text-faint group-hover:text-muted">
                    {t.desc}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab panels */}
        <div>
          {tab === "overview" && <MarketOverview />}
          {tab === "screener" && <TokenScreener />}
          {tab === "smart"    && <SmartMoney />}
          {tab === "intel"    && (
            <div className="space-y-6">
              <MarketIntelSection />
              <CopilotTerminal />
              <LiveSignalStream />
            </div>
          )}
        </div>

        <Footer />
      </main>
    </div>
  );
}

function Header({
  onOpenConnect,
  onOpenMcp,
}: {
  onOpenConnect: () => void;
  onOpenMcp: () => void;
}) {
  const { session } = useAgentSession();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-accent/40 bg-accent/10 transition-colors group-hover:border-accent">
            <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-accent" fill="none" strokeWidth="1.8">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              <circle cx="12" cy="12" r="1.5" fill="#c9a227" stroke="none" />
            </svg>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-base font-bold tracking-tight text-foreground">BACKED</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
              Binance Agent OS
            </span>
          </div>
        </a>
        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline-flex rounded border border-border bg-surface px-3 py-1 font-mono text-xs text-muted">
            Network: <span className="font-medium text-foreground ml-1">BSC Testnet</span>
          </span>

          <button
            onClick={onOpenMcp}
            className="rounded border border-border bg-surface-raised px-3 py-1 font-mono text-xs text-muted hover:border-accent hover:text-accent transition-colors flex items-center gap-1.5"
            title="Connect Claude Code, Codex, Groq or Hermes via MCP"
          >
            <span>🔌 External Agents (MCP)</span>
          </button>

          {session.connected ? (
            <button
              onClick={onOpenConnect}
              className="rounded border border-success/40 bg-success/10 px-3 py-1 font-mono text-xs font-semibold text-success hover:bg-success/20 transition-colors flex items-center gap-2"
              title="Click to view or manage Binance Agent OS Session"
            >
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span>Agent OS: Connected</span>
            </button>
          ) : (
            <button
              onClick={onOpenConnect}
              className="rounded border border-accent/50 bg-accent/20 px-3.5 py-1 font-mono text-xs font-bold text-accent hover:bg-accent hover:text-on-accent transition-colors flex items-center gap-1.5 shadow-sm shadow-accent/20 animate-pulse"
            >
              <span>⚡ Connect Binance Agent OS</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-border pt-6 text-xs text-faint">
      <p className="font-mono">
        BACKED · Autonomous Market Intel Agent powered by Binance Agent OS.
        All decisions are cryptographically anchored onto BNB Smart Chain (BSC Testnet).
      </p>
    </footer>
  );
}
