"use client";

import { useState } from "react";
import { Hero } from "@/components/hero";
import { TokenScreener } from "@/components/token-screener";
import { SmartMoney } from "@/components/smart-money";
import { MarketOverview } from "@/components/market-overview";
import { QuantAlphaSection } from "@/components/quant-alpha-section";
import { McpIntegrateModal } from "@/components/mcp-integrate-modal";

const TABS = [
  { id: "overview",  label: "Market Overview",  desc: "Macro volume, OI & 700+ breadth" },
  { id: "screener",  label: "Token Screener",    desc: "718 Live Binance Perps" },
  { id: "smart",     label: "Smart Money",       desc: "Top institutional positioning & bias" },
  { id: "intel",     label: "Quant Alpha & Workflows", desc: "Systematic alpha signals & agent execution" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Home() {
  const [tab, setTab] = useState<TabId>("overview");
  const [mcpOpen, setMcpOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        onOpenMcp={() => setMcpOpen(true)}
      />
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
          {tab === "intel"    && <QuantAlphaSection />}
        </div>

        <Footer />
      </main>
    </div>
  );
}

function Header({
  onOpenMcp,
}: {
  onOpenMcp: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <a href="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo.png"
            alt="BACKED Logo"
            className="h-7 w-7 rounded-full object-cover border border-accent/50 shadow-sm shadow-accent/20 transition-transform group-hover:scale-105"
          />
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-base font-bold tracking-tight text-foreground">BACKED</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
              Binance Agent OS
            </span>
          </div>
        </a>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenMcp}
            className="rounded border border-border bg-surface-raised px-3 py-1 font-mono text-xs text-muted hover:border-accent hover:text-accent transition-colors flex items-center gap-1.5"
            title="Connect Claude Code, Cursor, Grok (xAI) or Hermes via MCP"
          >
            <span>External Agents (MCP)</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-border/80 pt-8 pb-12 text-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="BACKED Logo"
              className="h-5 w-5 rounded-full object-cover border border-accent/40"
            />
            <span className="font-mono font-bold tracking-tight text-foreground">BACKED</span>
          </div>
          <p className="font-mono text-[11px] text-muted max-w-2xl leading-relaxed">
            Agentic quant alpha scanner on Binance Agent OS. Scans 718 perpetual contracts and dispatches structured alpha workflows via MCP — external agents execute trades on their own accounts. BACKED does not buy, sell, or hold funds.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-faint">
          <a
            href="/api/mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent transition-colors flex items-center gap-1"
          >
            <span>MCP Server</span>
            <span className="text-[9px] text-accent">/api/mcp</span>
          </a>
          <span className="text-border">·</span>
          <a
            href="/api/openapi.json"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent transition-colors"
          >
            OpenAPI 3.1
          </a>
        </div>
      </div>
    </footer>
  );
}
