"use client";

import { useState, useEffect } from "react";

const TABS = [
  { id: "claude_code", label: "Claude Code" },
  { id: "claude_ai", label: "Claude.ai (Web)" },
  { id: "hermes", label: "Nous Hermes 3" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function McpIntegrateModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("claude_code");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const currentIndex = TABS.findIndex((t) => t.id === activeTab);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < TABS.length - 1;

  const handlePrev = () => {
    if (hasPrev) setActiveTab(TABS[currentIndex - 1].id);
  };

  const handleNext = () => {
    if (hasNext) setActiveTab(TABS[currentIndex + 1].id);
    else onClose();
  };

  if (!isOpen) return null;

  function handleCopy(text: string, id: string) {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    }
  }

  const PROD_URL = "https://backed-zeta.vercel.app";

  const mcpJson = JSON.stringify(
    { mcpServers: { backed: { url: `${PROD_URL}/api/mcp` } } },
    null,
    2
  );

  const claudeCmd = `claude mcp add backed --transport http ${PROD_URL}/api/mcp`;
  const claudeManualJson = mcpJson;
  const claudeAiUrl = `${PROD_URL}/api/mcp`;
  const claudeAiPrompt = `Scan BACKED for negative funding gamma squeeze setups and institutional flow absorption. Show me the visual model distribution pie chart and the top trade blueprints.`;

  const hermesDesktopJson = JSON.stringify(
    { mcpServers: { backed: { url: `${PROD_URL}/api/mcp`, timeout: 60 } } },
    null,
    2
  );
  const hermesYaml = `mcp_servers:
  backed:
    url: "${PROD_URL}/api/mcp"
    timeout: 60
    # 24/7 All-Market Intelligence Tools (Non-Custodial):
    #  mcp__backed__backed_get_quant_alpha_signals
    #  mcp__backed__backed_get_market_overview
    #  mcp__backed__backed_get_screener_all_contracts
    #  mcp__backed__backed_get_smart_money_intel
    #  mcp__backed__backed_get_smart_money_clusters
    #  mcp__backed__backed_get_whale_exhaustion_signals
    #  mcp__backed__backed_calculate_intent_trade_setup
    #  mcp__backed__backed_smart_exit_whale_shield`;

  function Section({
    recommended,
    badge,
    title,
    sub,
    desc,
    code,
    copyId,
    copyLabel,
    tips,
  }: {
    recommended?: boolean;
    badge?: string;
    title: string;
    sub?: string;
    desc: string;
    code: string;
    copyId: string;
    copyLabel: string;
    tips?: { label: string; cmd: string }[];
  }) {
    return (
      <div
        className={`rounded-lg border p-3 space-y-2 ${
          recommended ? "border-accent/20 bg-accent/5" : "border-border bg-surface-raised"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wide ${recommended ? "text-accent" : "text-foreground"}`}>
            {title}
          </span>
          {badge ? (
            <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${recommended ? "bg-accent/20 text-accent" : "bg-surface text-muted"}`}>
              {badge}
            </span>
          ) : sub ? (
            <span className="text-[9px] text-muted">{sub}</span>
          ) : null}
        </div>
        <p className="text-[11px] text-muted leading-relaxed">{desc}</p>
        <div className="relative rounded border border-border bg-background p-2.5">
          <pre className="text-[11px] text-accent overflow-x-auto select-all pr-16 whitespace-pre-wrap">{code}</pre>
          <button
            onClick={() => handleCopy(code, copyId)}
            className="absolute top-2 right-2 rounded border border-accent/30 bg-accent/10 px-2 py-0.5 text-[9px] font-bold text-accent hover:bg-accent hover:text-on-accent transition-colors"
          >
            {copied === copyId ? "Copied ✓" : copyLabel}
          </button>
        </div>
        {tips && tips.length > 0 && (
          <div className="space-y-0.5">
            {tips.map((t) => (
              <p key={t.cmd} className="text-[10px] text-muted">
                › <code className="text-accent">{t.cmd}</code>
                {t.label ? ` — ${t.label}` : ""}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-fade-in font-mono"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-xl border border-border bg-surface shadow-2xl overflow-hidden animate-scale-up"
      >
        {/* Sticky Top Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-border px-5 py-3.5 bg-surface-raised">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="BACKED Logo"
              className="h-6 w-6 rounded-full object-cover border border-accent/40"
            />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Connect External Agents &amp; Models
              </h3>
              <p className="text-[10px] text-muted">
                Official MCP Server (Protocol 2024-11-05) · 8 Tools Active
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="rounded p-1 text-muted hover:text-foreground hover:bg-surface transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Sticky Tab Bar */}
        <div className="shrink-0 px-5 pt-3 border-b border-border bg-surface flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-1.5 rounded-t text-[11px] font-semibold tracking-wider transition-colors border-b-2 ${
                activeTab === t.id
                  ? "border-accent text-accent bg-accent/10"
                  : "border-transparent text-muted hover:text-foreground hover:bg-surface-raised"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          <p className="text-xs text-muted leading-relaxed">
            BACKED is an autonomous Quant Alpha &amp; Intelligence Agent running natively on Binance Agent OS. 100% non-custodial: external agents connect via MCP, inspect visual charts &amp; quantitative trade blueprints, and execute orders directly on their own exchange accounts.
          </p>

          {/* TAB 1: Claude Code */}
          {activeTab === "claude_code" && (
            <div className="space-y-4">
              <Section
                recommended badge="Recommended"
                title="Claude Code CLI — One Command"
                desc="Run this single command in your terminal. BACKED is permanently registered in Claude Code across all projects — no manual config needed."
                code={claudeCmd} copyId="claude_cmd" copyLabel="Copy Command"
                tips={[
                  { cmd: "claude mcp list", label: "verify backed appears (8 tools active)" },
                  { cmd: '"Scan BACKED for high-conviction quant alpha signals and show trading blueprints"', label: "say in Claude Code" },
                  { cmd: '"Show 24/7 market overview with Long/Short breadth pie chart"', label: "say in Claude Code" },
                  { cmd: '"Show 50-coin institutional positioning clusters"', label: "say in Claude Code" },
                ]}
              />
              <Section
                badge="Desktop"
                title="Claude Desktop — Manual Config"
                sub="~/.claude/claude_desktop_config.json"
                desc="Add this block to your Claude Desktop configuration file for a permanent connection with visual Mermaid charts."
                code={claudeManualJson} copyId="claude_json" copyLabel="Copy JSON"
                tips={[
                  { cmd: "~/.claude/claude_desktop_config.json", label: "config file location" },
                  { cmd: "Restart Claude Desktop", label: "tools auto-discovered upon relaunch" },
                ]}
              />
            </div>
          )}

          {/* TAB 2: Claude.ai Web */}
          {activeTab === "claude_ai" && (
            <div className="space-y-4">
              <Section
                recommended badge="Web Connector"
                title="Claude.ai Web — Add Custom Connector"
                desc="Connect directly in Claude.ai (Web). Supports RFC 8414 OAuth discovery & RFC 7591 dynamic client registration — zero login credentials needed, auto-authorizes instantly."
                code={claudeAiUrl} copyId="claude_ai_url" copyLabel="Copy URL"
                tips={[
                  { cmd: "Claude.ai -> Settings -> Connectors -> Add Custom Connector", label: "navigation" },
                  { cmd: "Paste URL: https://backed-zeta.vercel.app/api/mcp", label: "connector URL" },
                  { cmd: "Instant zero-auth handshake connects all 8 tools automatically", label: "no password required" },
                ]}
              />
              <Section
                badge="Example Prompt"
                title="Claude.ai Prompt — Natural Language Quant Trading"
                desc="Once connected, prompt Claude in natural language to analyze the whole market and return visual charts + execution code."
                code={claudeAiPrompt} copyId="claude_ai_prompt" copyLabel="Copy Prompt"
                tips={[
                  { cmd: "Displays Mermaid Pie Charts inline in chat", label: "visual charts" },
                  { cmd: "Displays Unicode ASCII Bar Charts for VPIN", label: "orderflow toxicity" },
                  { cmd: "Provides ready-to-run Python CCXT code", label: "non-custodial execution" },
                ]}
              />
            </div>
          )}

          {/* TAB 3: Nous Hermes 3 */}
          {activeTab === "hermes" && (
            <div className="space-y-4">
              <Section
                recommended badge="Recommended"
                title="Hermes Desktop App — Import JSON"
                desc="Open Hermes Desktop -> Settings -> MCP Servers -> Import JSON. Paste below — BACKED is permanent with 8 auto-discovered tools."
                code={hermesDesktopJson} copyId="hermes_desktop" copyLabel="Copy JSON"
                tips={[
                  { cmd: "Settings -> MCP Servers -> Import JSON", label: "navigation" },
                  { cmd: "backed_get_quant_alpha_signals", label: "5 quant models + visual charts" },
                  { cmd: "backed_get_market_overview", label: "macro breadth + pie chart" },
                  { cmd: "backed_get_smart_money_clusters", label: "50-coin scatter clusters" },
                ]}
              />
              <Section
                badge="CLI"
                title="Hermes CLI — ~/.hermes/config.yaml (One-time)"
                sub="~/.hermes/config.yaml"
                desc="Add this block once — Hermes CLI permanently connects to BACKED. No model name or server URL needed on subsequent runs."
                code={hermesYaml} copyId="hermes_yaml" copyLabel="Copy YAML"
                tips={[
                  { cmd: "hermes config edit", label: "open config in editor" },
                  { cmd: "hermes mcp test backed", label: "verify connection" },
                  { cmd: "/reload-mcp", label: "hot-reload inside any chat session" },
                ]}
              />
            </div>
          )}
        </div>

        {/* Sticky Footer with Back / Next Navigation Controls */}
        <div className="shrink-0 flex items-center justify-between border-t border-border px-5 py-3 bg-surface-raised">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={!hasPrev}
              className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                hasPrev
                  ? "border-border bg-surface text-foreground hover:border-accent hover:text-accent cursor-pointer"
                  : "border-border/30 bg-surface/30 text-muted/30 cursor-not-allowed"
              }`}
            >
              <span>&larr;</span>
              <span>Back</span>
            </button>

            <button
              onClick={handleNext}
              className="px-3.5 py-1.5 rounded text-xs font-semibold border border-accent bg-accent text-on-accent hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
            >
              <span>{hasNext ? "Next" : "Done"}</span>
              <span>&rarr;</span>
            </button>

            <span className="text-[11px] text-muted ml-2 font-mono">
              Step {currentIndex + 1} of {TABS.length}: <span className="text-foreground font-semibold">{TABS[currentIndex].label}</span>
            </span>
          </div>

          <button
            onClick={onClose}
            className="rounded border border-border bg-surface px-4 py-1.5 text-xs font-semibold text-muted hover:text-foreground hover:border-accent transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
