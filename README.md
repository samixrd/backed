# BACKED — Autonomous Market Intel & Trade Agent

> **Institutional-grade market intelligence, intent-driven autonomous execution, and provable alpha on BNB Smart Chain — powered natively by Binance Agent OS.**
> Built for the **Binance Agent OS Hackathon · Track A & B** (AI Agents + Data & Analysis + Trading Workflows).

---

## 🌐 Live Production Deployment

- 🖥️ **Web Dashboard (Live):** [https://backed-zeta.vercel.app](https://backed-zeta.vercel.app)
- 🔌 **Official MCP Server (Claude Code / Cursor):** `https://backed-zeta.vercel.app/api/mcp`
- 📜 **OpenAPI 3.1 Spec (OpenAI Codex / Custom GPTs):** `https://backed-zeta.vercel.app/api/openapi.json`
- 🐙 **GitHub Repository:** [https://github.com/samixrd/backed](https://github.com/samixrd/backed)

---

## 1. What is BACKED?

Every AI claims high accuracy, but everyday traders are overwhelmed by complex derivatives metrics, and nobody can verify if an agent's claimed track record is real or backdated.

**BACKED bridges this gap with 5 core innovations**:

1. **718-Contract Live Screener:** Ingests live Binance Futures Open Interest (OI), Top Trader Long/Short account ratios, and Taker Buy/Sell aggression pressure across all 718 USDT perpetual contracts.
2. **Universal Intent Trading Engine:** Formulate natural-language trading goals (*"open 5 usdt trade what most smart money doing on SOL"*). The agent automatically classifies intent (`OPEN_TRADE`, `CLOSE_TRADE`, `INQUIRY`), queries live Binance derivatives, determines direction, fills the order, and outputs a cryptographic receipt.
3. **Whale Trap Shield (Smart Exit):** Front-runs retail panic by monitoring microstructure exhaustion at key resistance levels. Automatically closes active positions at live market price, secures positive realized PnL, and preserves capital.
4. **Provable Alpha (BSC Testnet Anchor):** Every trade decision and settlement is hashed (`SHA256`) and anchored onto the **BNB Smart Chain (BSC Testnet)** before execution. Immutable block timestamps provide tamper-evident mathematical proof against backdating, while preserving strategy IP.
5. **Universal Agent OS Native (MCP Provider):** Any external coding or reasoning agent (Claude Code, Cursor IDE, OpenAI Codex, Groq/Hermes) can connect to BACKED via the **Model Context Protocol (MCP)** with a single command.

---

## 2. Core Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BINANCE AGENT OS RUNTIME                        │
│                                                                        │
│   [ Live Market Screener ]         [ Azure GPT-4o-mini Brain ]         │
│   718 Binance Perpetual Contracts  Synthesizes Multi-Metric Flow       │
│   Top Trader Long/Short Bias  ──>  Detects Market Regimes (Squeeze/    │
│   Taker Flow Aggression            Accumulation/Distribution)          │
│   Open Interest in USD             Calculates Conviction (60-95%)      │
│                                                                        │
│   [ Intent Execution Engine ]      [ Whale Trap Shield ]               │
│   Natural Language -> Live Trade   Autonomous Front-run Exit           │
│   Automatic sizing & filling       Exhaustion Radar & Microstructure   │
│                                                                        │
│   [ Provable Alpha Engine ]        [ Onchain Anchor (BSC Testnet) ]    │
│   decisionHash = SHA256(decision)  Anchored via real transaction:      │
│   reasonHash   = SHA256(reasoning) Tx: 0x22ecef7c...58c358e            │
│   (Zero IP Leakage)                Block timestamp = Anti-Backdating   │
│                                                                        │
│   [ Universal MCP Server ]         [ Institutional Dark Terminal ]     │
│   Claude Code / Cursor / Codex     Brass Accent (#c9a227) UI           │
│   Protocol: JSON-RPC 2.0 (v2)      Scatter Plot, Screener, Copilot     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Instant Connect with External Agents (MCP)

### Claude Code (Terminal CLI)
Connect BACKED to your Claude Code terminal in 1 second:
```bash
claude mcp add backed --transport http https://backed-zeta.vercel.app/api/mcp
```

### Cursor IDE & Claude Desktop
Add to your `claude_desktop_config.json` or `~/.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "backed": {
      "url": "https://backed-zeta.vercel.app/api/mcp"
    }
  }
}
```

### Available MCP Tools

| Tool Name | What It Does |
|---|---|
| `backed_get_smart_money_intel` | Ingest real-time smart money positioning across 718 Binance Futures contracts (Top Trader Ratio, Taker Flow, OI, Institutional Regime). |
| `backed_execute_intent_trade` | Autonomously execute a market order on Binance Futures and anchor cryptographic settlement proof to BSC Testnet. |
| `backed_smart_exit_whale_shield` | Autonomously front-run retail panic and exit active positions when whales exhaust liquidity at resistance. |

---

## 4. Live Onchain Proofs (BSC Testnet)

Every trade intent and settlement is verified onchain. Inspect recent live transactions:

- **SOL Long Intent Anchor:** [`0x22ecef7c7b9f3bb0372b8103c921092b78c2044378932611ab8c4d3aa58c358e`](https://testnet.bscscan.com/tx/0x22ecef7c7b9f3bb0372b8103c921092b78c2044378932611ab8c4d3aa58c358e)
- **Whale Shield Exit Anchor:** [`0xec20ddbdf187517c8d4f94537506b643321cee9a86c06e7c1da1444556e65e13`](https://testnet.bscscan.com/tx/0xec20ddbdf187517c8d4f94537506b643321cee9a86c06e7c1da1444556e65e13)
- **Audit Verification Verdict:** `PASS ✓` — chain continuity verified without backdating.

---

## 5. Quickstart (Local Development)

```bash
# 1. Clone & Install
git clone https://github.com/samixrd/backed.git
cd backed
npm install

# 2. Run unit tests (25/25 passing)
npm test

# 3. Test autonomous fund pipeline dry-run
npm run fund:dryrun

# 4. Launch Next.js Web Terminal
cd web
npm install
npm run dev
# Open http://localhost:3000
```

---

## 6. Repository Layout

```
BACKED/
├── src/
│   ├── market-intel.ts      # Live Binance Futures derivatives, OI, & Taker flow
│   ├── reasoning.ts         # Azure GPT-4o-mini structured intelligence engine
│   ├── pipeline.ts          # Autonomous fund loop (ingest -> reason -> anchor -> persist)
│   ├── anchor.ts            # BSC Testnet onchain commit proof
│   ├── verifier.ts          # Independent cryptographic audit agent
│   ├── datasource.ts        # Multi-source price corroboration (Binance + Coinbase)
│   ├── canonical.ts         # Deterministic serialization (Trust Root)
│   ├── provable.ts          # SHA-256 hash-chaining and proof math
│   ├── mcp-client.ts        # Binance Agentic MCP client (OAuth + JSON-RPC)
│   └── store.ts             # Supabase (`backed` schema) + LocalStore
├── web/                     # Next.js Institutional Dark Terminal (Deployed on Vercel)
│   ├── app/
│   │   ├── page.tsx         # Main Dashboard Layout
│   │   └── api/
│   │       ├── copilot/     # Universal Intent Trading API (Open/Close/Inquiry)
│   │       ├── mcp/         # Official MCP Server (JSON-RPC 2.0)
│   │       ├── openapi.json/# OpenAPI 3.1 Spec for Codex / GPTs
│   │       ├── intel/       # Single coin deep intelligence API
│   │       ├── screener/    # 718 perpetual contracts live screener
│   │       ├── trade/       # Execute & Smart Exit routes
│   │       └── run/         # End-to-end 24/7 pipeline cron runner
│   └── components/
│       ├── hero.tsx                 # Binance Agent OS Spotlight Hero
│       ├── token-screener.tsx       # 718-contract search & filter table
│       ├── smart-money.tsx          # 50-coin sentiment scatter plot
│       ├── copilot-terminal.tsx     # Intent Copilot & Whale Trap Shield Radar
│       ├── connect-modal.tsx        # Binance Agent OS Session Manager
│       └── mcp-integrate-modal.tsx  # Claude/Cursor/Codex 1-click integration guide
├── test/                    # 25 automated unit tests
├── AGENTS.md                # Binance Agent OS runtime instructions
├── DATA_SOURCES.md          # Real-time market endpoints specification
├── DEMO_SCRIPT.md           # 90-second hackathon presentation script
└── PROVABLE_ALPHA_SPEC.md   # Cryptographic architecture specification
```
