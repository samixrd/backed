"use client";

import { useState, useEffect } from "react";

const TABS = [
  { id: "claude_code", label: "Claude Code" },
  { id: "cursor", label: "Cursor & Windsurf" },
  { id: "grok", label: "xAI Grok" },
  { id: "hermes", label: "Nous Hermes 3" },
  { id: "codex", label: "OpenAI Codex" },
  { id: "python_mcp", label: "Python MCP Client" },
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

  const cursorJson = mcpJson;
  const windsurfJson = JSON.stringify(
    { mcpServers: { backed: { serverUrl: `${PROD_URL}/api/mcp`, type: "sse" } } },
    null,
    2
  );

  const grokMcpJson = mcpJson;
  const grokPython = `# xAI Grok (Grok-2) + BACKED Smart Money Intel
from openai import OpenAI
import requests

client = OpenAI(
    api_key="xai-your-api-key",
    base_url="https://api.x.ai/v1",
)

intel = requests.get("${PROD_URL}/api/intel?symbol=SOLUSDT").json()
prompt = (
    f"SOL Smart Money: {intel.get('regime')} | "
    f"{intel.get('topLongPct')}% Long | Taker: {intel.get('takerRatio')}x. "
    "Formulate quant trade rationale."
)

resp = client.chat.completions.create(
    model="grok-2-latest",
    messages=[
        {"role": "system", "content": "You are a quant agent on Binance Agent OS powered by BACKED."},
        {"role": "user", "content": prompt},
    ],
)
print(resp.choices[0].message.content)`;

  const hermesDesktopJson = JSON.stringify(
    { mcpServers: { backed: { url: `${PROD_URL}/api/mcp`, timeout: 60 } } },
    null,
    2
  );
  const hermesYaml = `mcp_servers:
  backed:
    url: "${PROD_URL}/api/mcp"
    timeout: 60
    # auto-discovered tools:
    #  mcp__backed__backed_get_smart_money_intel
    #  mcp__backed__backed_execute_intent_trade
    #  mcp__backed__backed_smart_exit_whale_shield`;

  const openApiUrl = `${PROD_URL}/api/openapi.json`;
  const codexPython = `# OpenAI Codex — call BACKED via JSON-RPC 2.0
import httpx, asyncio

async def backed(tool: str, args: dict):
    r = await httpx.AsyncClient().post(
        "${PROD_URL}/api/mcp",
        json={"jsonrpc":"2.0","id":1,"method":"tools/call",
              "params":{"name":tool,"arguments":args}},
        timeout=30,
    )
    return r.json()["result"]["content"][0]["text"]

async def main():
    print(await backed("backed_get_smart_money_intel", {"symbol": "BTCUSDT"}))

asyncio.run(main())`;

  const pythonMcp = `# Universal Python MCP Client — LangChain / CrewAI / AutoGen / custom
import asyncio, httpx

async def call_backed(tool_name: str, args: dict) -> str:
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "${PROD_URL}/api/mcp",
            json={
                "jsonrpc": "2.0", "id": 1,
                "method": "tools/call",
                "params": {"name": tool_name, "arguments": args},
            },
            timeout=30.0,
        )
        return res.json()["result"]["content"][0]["text"]

async def main():
    intel = await call_backed("backed_get_smart_money_intel", {"symbol": "BTCUSDT"})
    print("Intel:", intel)
    trade = await call_backed("backed_execute_intent_trade",
                               {"symbol": "BTCUSDT", "side": "BUY", "amountUsd": 5})
    print("Trade:", trade)
    exit_ = await call_backed("backed_smart_exit_whale_shield", {"symbol": "BTCUSDT"})
    print("Exit:", exit_)

asyncio.run(main())`;

  const pythonCurl = `curl -s -X POST ${PROD_URL}/api/mcp \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0", "id": 1,
    "method": "tools/call",
    "params": {
      "name": "backed_get_smart_money_intel",
      "arguments": {"symbol": "SOLUSDT"}
    }
  }' | python3 -m json.tool`;

  function CopyBtn({ id, label }: { id: string; label: string }) {
    return (
      <button
        onClick={() => handleCopy(id, id)}
        className="absolute top-2 right-2 rounded border border-accent/30 bg-accent/10 px-2 py-0.5 text-[9px] font-bold text-accent hover:bg-accent hover:text-on-accent transition-colors"
      >
        {copied === id ? "Copied ✓" : label}
      </button>
    );
  }

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
          <pre className="text-[11px] text-accent overflow-x-auto select-all pr-16">{code}</pre>
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
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" />
            </span>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Connect External Agents &amp; Models
              </h3>
              <p className="text-[10px] text-muted">
                Official MCP Server (Protocol 2024-11-05) &amp; OpenAPI 3.1
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

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          <p className="text-xs text-muted leading-relaxed">
            BACKED is a universal MCP server. Any agent below can discover 718-contract smart money derivatives, execute intent trades, and trigger Whale Trap Shield exits directly from their runtime.
          </p>

          {activeTab === "claude_code" && (
            <div className="space-y-4">
              <Section
                recommended badge="Recommended"
                title="Claude Code CLI — One Command"
                desc="Run this single command in your terminal. BACKED is permanently registered in Claude Code across all projects — no config file needed."
                code={claudeCmd} copyId="claude_cmd" copyLabel="Copy Command"
                tips={[
                  { cmd: "claude mcp list", label: "verify backed appears" },
                  { cmd: '"Check smart money on SOLUSDT"', label: "say in Claude Code" },
                ]}
              />
              <Section
                badge="Manual"
                title="Claude Desktop — Manual JSON Config"
                sub="~/.claude/claude_desktop_config.json"
                desc="Alternatively, add this to your Claude Desktop config file for a persistent GUI connection."
                code={claudeManualJson} copyId="claude_json" copyLabel="Copy JSON"
                tips={[{ cmd: "~/.claude/claude_desktop_config.json", label: "config path" }]}
              />
            </div>
          )}

          {activeTab === "cursor" && (
            <div className="space-y-4">
              <Section
                recommended badge="Cursor"
                title="Cursor — ~/.cursor/mcp.json"
                desc="Add to your Cursor MCP config. BACKED tools auto-appear in Composer and Chat for every project. Persistent across sessions."
                code={cursorJson} copyId="cursor_json" copyLabel="Copy JSON"
                tips={[
                  { cmd: "~/.cursor/mcp.json", label: "global config" },
                  { cmd: ".cursor/mcp.json", label: "project-level config" },
                ]}
              />
              <Section
                badge="Windsurf"
                title="Windsurf — ~/.codeium/windsurf/mcp_config.json"
                sub="Windsurf format"
                desc="Windsurf uses a slightly different key. Add this to your Windsurf MCP config for the same persistent connection."
                code={windsurfJson} copyId="windsurf_json" copyLabel="Copy JSON"
                tips={[{ cmd: "~/.codeium/windsurf/mcp_config.json", label: "config path" }]}
              />
            </div>
          )}

          {activeTab === "grok" && (
            <div className="space-y-4">
              <Section
                recommended badge="Recommended"
                title="Grok in IDE — MCP Server Config"
                desc="If using Grok inside Cursor or any MCP-aware IDE, add BACKED as a persistent MCP server. Grok auto-calls all 3 BACKED tools without any extra code."
                code={grokMcpJson} copyId="grok_mcp" copyLabel="Copy JSON"
                tips={[
                  { cmd: "backed_get_smart_money_intel", label: "auto-callable tool" },
                  { cmd: "backed_execute_intent_trade", label: "auto-callable tool" },
                  { cmd: "backed_smart_exit_whale_shield", label: "auto-callable tool" },
                ]}
              />
              <Section
                badge="Python SDK"
                title="Grok Python — Direct API + BACKED Intel"
                sub="api.x.ai"
                desc="Feed live BACKED smart money data into Grok-2 for autonomous quant analysis. Uses api.x.ai endpoint."
                code={grokPython} copyId="grok_py" copyLabel="Copy Code"
                tips={[{ cmd: "pip install openai requests", label: "install deps" }]}
              />
            </div>
          )}

          {activeTab === "hermes" && (
            <div className="space-y-4">
              <Section
                recommended badge="Recommended"
                title="Hermes Desktop App — Import JSON"
                desc="Open Hermes Desktop -> Settings -> MCP Servers -> Import JSON. Paste below — BACKED is permanent. Tools auto-discovered, no model flag needed."
                code={hermesDesktopJson} copyId="hermes_desktop" copyLabel="Copy JSON"
                tips={[
                  { cmd: "Settings -> MCP Servers -> Import JSON", label: "navigation" },
                  { cmd: "mcp__backed__backed_get_smart_money_intel", label: "tool prefix after import" },
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

          {activeTab === "codex" && (
            <div className="space-y-4">
              <Section
                recommended badge="Recommended"
                title="Custom GPT / Codex — OpenAPI 3.1 Import URL"
                desc="In ChatGPT: Create a GPT -> Actions -> Import from URL. Paste this URL — all 3 BACKED tools instantly available as GPT Actions with full schema."
                code={openApiUrl} copyId="codex_url" copyLabel="Copy URL"
                tips={[
                  { cmd: "ChatGPT -> Create a GPT -> Actions -> Import from URL", label: "navigation" },
                  { cmd: "GET /api/openapi.json", label: "live OpenAPI 3.1 spec" },
                ]}
              />
              <Section
                badge="Python SDK"
                title="Codex Python — Direct JSON-RPC 2.0"
                sub="httpx + asyncio"
                desc="Call BACKED tools from any Python script using standard JSON-RPC 2.0. Works with LangChain, AutoGen, or raw httpx."
                code={codexPython} copyId="codex_py" copyLabel="Copy Code"
                tips={[{ cmd: "pip install httpx", label: "only dependency" }]}
              />
            </div>
          )}

          {activeTab === "python_mcp" && (
            <div className="space-y-4">
              <Section
                recommended badge="Full Client"
                title="Python Async MCP Client — All 3 Tools"
                desc="Drop-in async client for LangChain, CrewAI, AutoGen, or any custom Python agent. Calls all 3 BACKED tools over standard JSON-RPC 2.0."
                code={pythonMcp} copyId="python_full" copyLabel="Copy Client"
                tips={[
                  { cmd: "pip install httpx", label: "only dependency" },
                  { cmd: "python agent.py", label: "run" },
                ]}
              />
              <Section
                badge="Quick Test"
                title="cURL — Quick Terminal Test"
                sub="No Python needed"
                desc="Test the MCP server directly from your terminal. Pipe through python3 for pretty-printed JSON output."
                code={pythonCurl} copyId="python_curl" copyLabel="Copy cURL"
                tips={[
                  { cmd: `${PROD_URL}/api/mcp`, label: "MCP endpoint" },
                  { cmd: '"method": "tools/list"', label: "to see all available tools" },
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
