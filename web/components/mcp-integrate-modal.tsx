"use client";

import { useState } from "react";

export function McpIntegrateModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<
    "claude_code" | "cursor" | "grok" | "hermes" | "codex" | "python_mcp"
  >("claude_code");
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleCopy(text: string, id: string) {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    }
  }

  const PROD_URL = "https://backed-zeta.vercel.app";
  const claudeCodeCmd = `claude mcp add backed --transport http ${PROD_URL}/api/mcp`;

  const cursorJson = JSON.stringify(
    {
      mcpServers: {
        backed: {
          url: `${PROD_URL}/api/mcp`,
        },
      },
    },
    null,
    2
  );

  const openApiUrl = `${PROD_URL}/api/openapi.json`;

  // xAI Grok Python Snippet
  const grokPython = `# === xAI Grok (Grok-2 / Grok-beta) + BACKED ===
from openai import OpenAI
import requests

client = OpenAI(
    api_key="xai-your-api-key",
    base_url="https://api.x.ai/v1",
)

# 1. Fetch live 718-contract Smart Money Intel from BACKED
intel = requests.get("${PROD_URL}/api/intel?symbol=SOLUSDT").json()

# 2. Grok evaluates smart money positioning & decides trade action
prompt = f"SOL Smart Money is {intel.get('regime')} ({intel.get('topLongPct')}% Long, Taker Flow: {intel.get('takerRatio')}x). Formulate quant trade rationale."

response = client.chat.completions.create(
    model="grok-2-latest",
    messages=[
        {"role": "system", "content": "You are an autonomous quant hedge fund agent powered by BACKED on Binance Agent OS."},
        {"role": "user", "content": prompt}
    ]
)
print(response.choices[0].message.content)`;

  // Hermes persistent config.yaml snippet
  const hermesYaml = `mcp_servers:
  backed:
    url: "${PROD_URL}/api/mcp"
    timeout: 60
    # Tools auto-discovered: mcp__backed__backed_get_smart_money_intel
    #                        mcp__backed__backed_execute_intent_trade
    #                        mcp__backed__backed_smart_exit_whale_shield`;

  // Hermes Desktop App JSON import (same MCP server format, JSON flavour)
  const hermesDesktopJson = JSON.stringify(
    {
      mcpServers: {
        backed: {
          url: `${PROD_URL}/api/mcp`,
          timeout: 60,
        },
      },
    },
    null,
    2
  );

  // Universal Python MCP Client Snippet
  const pythonMcp = `# === Universal Python MCP Client (LangChain / CrewAI / AutoGen) ===
import asyncio
import httpx

async def call_backed(tool_name: str, args: dict):
    async with httpx.AsyncClient() as client:
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {"name": tool_name, "arguments": args}
        }
        res = await client.post("${PROD_URL}/api/mcp", json=payload, timeout=30.0)
        return res.json()["result"]["content"][0]["text"]

async def main():
    # 1. Get live smart money derivatives
    intel = await call_backed("backed_get_smart_money_intel", {"symbol": "BTCUSDT"})
    print("Market Intel:", intel)

    # 2. Execute trade intent with BSC onchain anchor
    trade = await call_backed("backed_execute_intent_trade", {
        "symbol": "BTCUSDT", "side": "BUY", "amountUsd": 5
    })
    print("Anchored Trade:", trade)

asyncio.run(main())`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in font-mono">
      <div className="w-full max-w-3xl rounded-xl border border-border bg-surface shadow-2xl overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-surface-raised">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" />
            </span>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Connect External Agents & Models
              </h3>
              <p className="text-[10px] text-muted">
                Official MCP Server (Protocol 2024-11-05) & OpenAPI 3.1
              </p>
            </div>
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
            BACKED operates as a universal Model Context Protocol (MCP) server. External agents can discover our 718-contract smart money derivatives, execute intent trades, and trigger Whale Trap Shield exits directly from their runtime.
          </p>

          {/* Client Navigation Tabs */}
          <div className="flex flex-wrap gap-1 border-b border-border pb-1">
            {[
              { id: "claude_code", label: "Claude Code" },
              { id: "cursor", label: "Cursor & Windsurf" },
              { id: "grok", label: "xAI Grok" },
              { id: "hermes", label: "Nous Hermes 3" },
              { id: "codex", label: "OpenAI Codex" },
              { id: "python_mcp", label: "Python MCP Client" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-1.5 rounded-t text-[11px] font-semibold tracking-wider transition-colors border-b-2 ${
                  activeTab === t.id
                    ? "border-accent text-accent bg-accent/10"
                    : "border-transparent text-muted hover:text-foreground hover:bg-surface-raised"
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
                Run this single command in your terminal to instantly add BACKED into <strong>Claude Code</strong>:
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
                <span className="text-accent font-semibold block">Now in Claude Code you can simply ask:</span>
                <p>› <em>&quot;Check smart money flow on SOLUSDT with backed_get_smart_money_intel&quot;</em></p>
                <p>› <em>&quot;Execute a 5 USDT long intent trade on BTCUSDT using backed_execute_intent_trade&quot;</em></p>
              </div>
            </div>
          )}

          {/* Tab 2: Cursor & Windsurf */}
          {activeTab === "cursor" && (
            <div className="space-y-3">
              <p className="text-xs text-foreground">
                Add this to your <code>~/.cursor/mcp.json</code> or <code>claude_desktop_config.json</code>:
              </p>
              <div className="relative rounded-lg border border-border bg-background p-3">
                <pre className="text-xs text-accent overflow-x-auto select-all">{cursorJson}</pre>
                <button
                  onClick={() => handleCopy(cursorJson, "cursor")}
                  className="absolute top-2 right-2 rounded border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-bold text-accent hover:bg-accent hover:text-on-accent transition-colors"
                >
                  {copied === "cursor" ? "Copied ✓" : "Copy JSON"}
                </button>
              </div>
              <p className="text-[11px] text-muted">
                Cursor & Windsurf will automatically detect all 3 BACKED tools in Composer and Chat.
              </p>
            </div>
          )}

          {/* Tab 3: xAI Grok */}
          {activeTab === "grok" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-foreground">
                  Python integration for <strong>xAI Grok (Grok-2 / Grok-beta)</strong>:
                </p>
                <span className="text-[10px] text-accent font-semibold">Uses api.x.ai Endpoint</span>
              </div>
              <div className="relative rounded-lg border border-border bg-background p-3 max-h-[260px] overflow-y-auto">
                <pre className="text-[11px] text-muted overflow-x-auto select-all">{grokPython}</pre>
                <button
                  onClick={() => handleCopy(grokPython, "grok")}
                  className="sticky top-0 float-right rounded border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-bold text-accent hover:bg-accent hover:text-on-accent transition-colors"
                >
                  {copied === "grok" ? "Copied ✓" : "Copy Code"}
                </button>
              </div>
            </div>
          )}

          {/* Tab 4: Nous Hermes 3 */}
          {activeTab === "hermes" && (
            <div className="space-y-4">

              {/* Section 1: Hermes Desktop App */}
              <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-accent uppercase tracking-wide">
                    🖥 Hermes Desktop App — Drag &amp; Drop Import
                  </span>
                  <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[9px] font-bold text-accent">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Open <strong>Hermes Desktop</strong> → Settings → MCP Servers → <em>Import JSON</em>. Paste the config below — BACKED will appear as a persistent server. Tools are auto-discovered with no model flag required.
                </p>
                <div className="relative rounded border border-border bg-background p-2.5">
                  <pre className="text-[11px] text-accent overflow-x-auto select-all">{hermesDesktopJson}</pre>
                  <button
                    onClick={() => handleCopy(hermesDesktopJson, "hermes_desktop")}
                    className="absolute top-2 right-2 rounded border border-accent/30 bg-accent/10 px-2 py-0.5 text-[9px] font-bold text-accent hover:bg-accent hover:text-on-accent transition-colors"
                  >
                    {copied === "hermes_desktop" ? "Copied ✓" : "Copy JSON"}
                  </button>
                </div>
                <p className="text-[10px] text-faint">
                  After import, Hermes Desktop shows 3 BACKED tools in the MCP panel — connection is permanent across sessions.
                </p>
              </div>

              {/* Section 2: Hermes CLI persistent config */}
              <div className="rounded-lg border border-border bg-surface-raised p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                    ⌨ Hermes CLI — Persistent Config (One-time Setup)
                  </span>
                  <span className="text-[9px] text-muted">~/.hermes/config.yaml</span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Add this block to <code>~/.hermes/config.yaml</code> once — Hermes CLI will permanently connect to BACKED without specifying a model or server URL on every run.
                </p>
                <div className="relative rounded border border-border bg-background p-2.5">
                  <pre className="text-[11px] text-accent overflow-x-auto select-all">{hermesYaml}</pre>
                  <button
                    onClick={() => handleCopy(hermesYaml, "hermes_yaml")}
                    className="absolute top-2 right-2 rounded border border-accent/30 bg-accent/10 px-2 py-0.5 text-[9px] font-bold text-accent hover:bg-accent hover:text-on-accent transition-colors"
                  >
                    {copied === "hermes_yaml" ? "Copied ✓" : "Copy YAML"}
                  </button>
                </div>
                <div className="space-y-1 text-[10px] text-muted">
                  <p>› <code className="text-accent">hermes config edit</code> — open config in your editor</p>
                  <p>› <code className="text-accent">hermes mcp test backed</code> — verify connection</p>
                  <p>› In any chat session type <code className="text-accent">/reload-mcp</code> to hot-reload without restart</p>
                </div>
              </div>

            </div>
          )}

          {/* Tab 5: OpenAI Codex */}
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
                <span className="text-accent font-semibold block">Import this URL in ChatGPT &gt; Create a GPT &gt; Actions &gt; Import from URL.</span>
              </div>
            </div>
          )}

          {/* Tab 6: Universal Python MCP */}
          {activeTab === "python_mcp" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-foreground">
                  Universal Python Client for <strong>LangChain, CrewAI, AutoGen</strong>, or custom bots:
                </p>
                <span className="text-[10px] text-accent font-semibold">Standard JSON-RPC 2.0</span>
              </div>
              <div className="relative rounded-lg border border-border bg-background p-3 max-h-[260px] overflow-y-auto">
                <pre className="text-[11px] text-muted overflow-x-auto select-all">{pythonMcp}</pre>
                <button
                  onClick={() => handleCopy(pythonMcp, "python_mcp")}
                  className="sticky top-0 float-right rounded border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-bold text-accent hover:bg-accent hover:text-on-accent transition-colors"
                >
                  {copied === "python_mcp" ? "Copied ✓" : "Copy Client"}
                </button>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-[10px] text-faint">
              Standard: MCP Protocol 2024-11-05 · JSON-RPC 2.0 · OpenAPI 3.1
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