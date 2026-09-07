"use client";

import { useState } from "react";

export function McpIntegrateModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"claude_code" | "cursor" | "codex" | "groq">("claude_code");
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleCopy(text: string, id: string) {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    }
  }

  const claudeCodeCmd = "claude mcp add backed --transport http http://localhost:3000/api/mcp";

  const cursorJson = JSON.stringify(
    {
      mcpServers: {
        backed: {
          url: "http://localhost:3000/api/mcp",
        },
      },
    },
    null,
    2
  );

  const openApiUrl = "http://localhost:3000/api/openapi.json";

  const groqPython = `from groq import Groq
import requests

client = Groq()

# 1. Fetch live BACKED Smart Money Intel
intel = requests.get("http://localhost:3000/api/intel?symbol=SOLUSDT").json()

# 2. Let Hermes/Groq decide trade execution based on live institutional regime
prompt = f"Smart Money Regime for SOL is {intel.get('regime')} ({intel.get('topLongPct')}% Long). Formulate trading decision."
completion = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": prompt}]
)
print(completion.choices[0].message.content)`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in font-mono">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-surface shadow-2xl overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-surface-raised">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" />
            </span>
            <span className="text-sm font-bold uppercase tracking-wider text-foreground">
              Connect External Agents (Claude, Codex, Groq, Hermes)
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-muted leading-relaxed">
            BACKED exposes a native <strong>Model Context Protocol (MCP)</strong> server & OpenAPI endpoint. You can plug it directly into <strong>Claude Code</strong>, <strong>Codex</strong>, <strong>Cursor</strong>, or <strong>Groq/Hermes</strong> to let external agents query institutional smart money alpha and execute trades.
          </p>

          {/* Client Tabs */}
          <div className="flex border-b border-border">
            {[
              { id: "claude_code", label: "Claude Code (CLI)" },
              { id: "cursor", label: "Claude Desktop / Cursor" },
              { id: "codex", label: "OpenAI Codex" },
              { id: "groq", label: "Groq / Hermes" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex-1 pb-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === t.id
                    ? "border-accent text-accent"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Claude Code */}
          {activeTab === "claude_code" && (
            <div className="space-y-3">
              <p className="text-xs text-foreground">
                Run this single command in your terminal to register BACKED as an MCP tool in Claude Code:
              </p>
              <div className="relative rounded-lg border border-border bg-background p-3 flex items-center justify-between">
                <code className="text-xs text-accent overflow-x-auto select-all">{claudeCodeCmd}</code>
                <button
                  onClick={() => handleCopy(claudeCodeCmd, "claude_code")}
                  className="rounded border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-bold text-accent hover:bg-accent hover:text-on-accent transition-colors shrink-0 ml-3"
                >
                  {copied === "claude_code" ? "Copied ✓" : "Copy Command"}
                </button>
              </div>
              <div className="rounded border border-accent/15 bg-accent-faint p-3 text-[11px] text-muted space-y-1">
                <span className="text-accent font-semibold block">Try this inside Claude Code:</span>
                <p>› <em>"From BACKED analysis, find the top smart money accumulation token and execute a $10 trade via Binance Agent OS."</em></p>
              </div>
            </div>
          )}

          {/* Tab 2: Cursor & Claude Desktop */}
          {activeTab === "cursor" && (
            <div className="space-y-3">
              <p className="text-xs text-foreground">
                Add this to your <code className="text-accent">claude_desktop_config.json</code> or Cursor MCP settings:
              </p>
              <div className="relative rounded-lg border border-border bg-background p-3">
                <pre className="text-xs text-muted overflow-x-auto select-all">{cursorJson}</pre>
                <button
                  onClick={() => handleCopy(cursorJson, "cursor")}
                  className="absolute top-2 right-2 rounded border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-bold text-accent hover:bg-accent hover:text-on-accent transition-colors"
                >
                  {copied === "cursor" ? "Copied ✓" : "Copy JSON"}
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: OpenAI Codex */}
          {activeTab === "codex" && (
            <div className="space-y-3">
              <p className="text-xs text-foreground">
                OpenAI Codex & Custom GPT Actions connect via OpenAPI 3.1 schema URL:
              </p>
              <div className="relative rounded-lg border border-border bg-background p-3 flex items-center justify-between">
                <code className="text-xs text-accent overflow-x-auto select-all">{openApiUrl}</code>
                <button
                  onClick={() => handleCopy(openApiUrl, "codex")}
                  className="rounded border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-bold text-accent hover:bg-accent hover:text-on-accent transition-colors shrink-0 ml-3"
                >
                  {copied === "codex" ? "Copied ✓" : "Copy URL"}
                </button>
              </div>
              <div className="rounded border border-accent/15 bg-accent-faint p-3 text-[11px] text-muted space-y-1">
                <span className="text-accent font-semibold block">Available Tools for Codex:</span>
                <p>› <code>getMarketIntel</code> — Real-time smart money positioning & regimes</p>
                <p>› <code>executeIntentTrade</code> — Autonomous Binance order execution with BSC Testnet anchor</p>
                <p>› <code>smartExitWhaleShield</code> — Whale front-run exit settlement</p>
              </div>
            </div>
          )}

          {/* Tab 4: Groq / Hermes */}
          {activeTab === "groq" && (
            <div className="space-y-3">
              <p className="text-xs text-foreground">
                Python SDK snippet for <strong>Groq</strong> or <strong>Nous Hermes-3</strong>:
              </p>
              <div className="relative rounded-lg border border-border bg-background p-3">
                <pre className="text-[11px] text-muted overflow-x-auto select-all">{groqPython}</pre>
                <button
                  onClick={() => handleCopy(groqPython, "groq")}
                  className="absolute top-2 right-2 rounded border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-bold text-accent hover:bg-accent hover:text-on-accent transition-colors"
                >
                  {copied === "groq" ? "Copied ✓" : "Copy Script"}
                </button>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-[10px] text-faint">
              Standard: MCP Protocol 2024-11-05 & OpenAPI 3.1
            </span>
            <button
              onClick={onClose}
              className="rounded border border-border bg-surface-raised px-5 py-1.5 text-xs font-semibold text-foreground hover:border-accent hover:text-accent transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
