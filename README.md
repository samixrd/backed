<div align="center">
  <img src="https://backed-zeta.vercel.app/logo.png" width="120" height="120" alt="BACKED Logo" style="border-radius: 50%;" />
  <h1>BACKED — 24/7 Agentic Quant Alpha Scanner on Binance Agent OS</h1>
  <p><strong>Institutional-grade quantitative intelligence, 5 algorithmic alpha models, and non-custodial trade workflows — powered natively by Binance Agent OS.</strong></p>
  <p>Built for the <strong>Binance Agent OS Hackathon</strong> (Track A: AI Agents)</p>
</div>

---

## Live Production Deployment

- **Web Terminal (Live):** [https://backed-zeta.vercel.app](https://backed-zeta.vercel.app)
- **Quant Alpha Signals API:** `https://backed-zeta.vercel.app/api/alpha/signals`
- **Universal MCP Server (JSON-RPC 2.0):** `https://backed-zeta.vercel.app/api/mcp`
- **OpenAPI 3.1 Spec (OpenAI Codex / Custom GPTs):** `https://backed-zeta.vercel.app/api/openapi.json`
- **GitHub Repository:** [https://github.com/samixrd/backed](https://github.com/samixrd/backed)

---

## 1. What is BACKED?

Most autonomous agents and retail traders either guess based on lagged indicators or run toy bots that require holding private keys on risky web servers.

**BACKED solves this as an Autonomous Quant Alpha & Strategy Agent running natively on Binance Agent OS**:

1. **100% Non-Custodial Agent-to-Agent (A2A) Architecture:** BACKED operates as the **Intelligence & Strategy Agent**. It does **NOT** touch or hold user funds. External **Execution Agents** (Claude Code, Claude.ai, Hermes) connect to BACKED over the Model Context Protocol (MCP) to receive actionable trade setups and execute orders directly on their own exchange accounts.
2. **Whole-Market 718-Contract Surveillance:** Ingests live Binance Futures Open Interest (USD), Top Trader Long/Short account ratios, and Taker Buy/Sell volume flow across all 718 USDT perpetual contracts 24/7.
3. **Hardcore Quantitative Decision Models:**
   - **VPIN (Volume-Synchronized Probability of Toxicity):** Measures informed institutional aggression picking off passive orderbook depth.
   - **Top Trader Margin Beta ($\beta_{\text{TT}}$ Divergence):** Quantifies whale accumulation vs retail trap positioning.
   - **4-Quadrant Velocity Matrix:** Categorizes market momentum into $Q_1$ Capital Expansion, $Q_2$ Short-Covering Exhaustion, $Q_3$ Institutional Short Breakdown, and $Q_4$ Liquidation Flush Reversal.
   - **Basis Dislocation & Funding Gamma Squeeze:** Detects deeply inverted funding ($< -0.005\%$) and spot-futures basis dislocations.
   - **Statistical Expected Value ($+EV\%$):** Mathematically verifies that every dispatched blueprint has positive expectation before broadcast.
4. **Actionable Trading Blueprints & 1-Click Execution:** Every signal delivers a complete non-custodial blueprint (entry limit zone, hard stop-loss, take-profit 1 & 2, risk/reward 1:2.4+) plus ready-to-execute Python CCXT and Claude Code commands.
5. **Visual Intelligence in Agent Chat:** When agents call BACKED via MCP, responses include **Mermaid Pie Charts** and **Unicode ASCII Progress Bar Charts** rendered natively inside Claude Desktop, Cursor, and terminal CLI interfaces.
6. **Cryptographic Integrity & Anti-Backdating:** Every setup is hashed (`SHA256`) at calculation time, providing verifiable proof of inception timestamp without exposing proprietary quant strategy IP.

---

### For Hackathon Judges: Why BACKED is an Autonomous AI Agent

```
┌────────────────────────────────────────────────────────────────────────┐
│                   AI AGENT LIFECYCLE (BINANCE AGENT OS)                │
│                                                                        │
│   1. SENSE (Perception)  ──> 24/7 Ingestion of 718 Binance Perps       │
│   2. REASON (Cognition)  ──> VPIN, Beta, 4-Quadrant Multi-Factor Models│
│   3. DECIDE (Strategy)   ──> Formulates Thesis & Statistical +EV%      │
│   4. ACT (Tool Use)      ──> Dispatches Execution Workflows via 8 MCPs │
└────────────────────────────────────────────────────────────────────────┘
```

- **Track A (AI Agents):** BACKED fulfills all 4 defining characteristics of an autonomous agent: continuous perception across 718 markets, cognitive quantitative reasoning, an autonomous 24/7 cron loop (`/api/run`), and standardized agent-to-agent communication (MCP).

---

## 2. Core Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BINANCE AGENT OS RUNTIME                        │
│                                                                        │
│  LAYER 1 — LIVE DATA INGESTION (Binance Futures API)                   │
│  ├─ fapi/v1/ticker/24hr        → 718 USDT perpetuals, price, volume   │
│  ├─ fapi/v1/premiumIndex       → Funding rate, mark/index price basis  │
│  ├─ futures/data/topLong..     → Top Trader Long/Short account ratio   │
│  ├─ futures/data/takerlong..   → Taker Buy/Sell volume flow ratio      │
│  └─ fapi/v1/openInterest       → Open Interest in USD per contract     │
│                                                                        │
│  LAYER 2 — QUANT COMPUTATION ENGINE (/api/alpha/signals)               │
│  ├─ VPIN Index        = |BuyVol - SellVol| / (BuyVol + SellVol)       │
│  ├─ Margin Beta (βTT) = (TopTraderLongPct - 50) / 10                  │
│  ├─ 4-Quadrant State = f(24h price change, Taker Buy/Sell ratio)       │
│  ├─ Basis Spread      = (MarkPrice - IndexPrice) / IndexPrice × 100    │
│  └─ +EV%             = (WinProb × TpGain) - (LossPpob × SlLoss)       │
│                                                                        │
│  LAYER 3 — 5-MODEL ALPHA CLASSIFIER (Multi-Factor Signal Engine)       │
│  ├─ NEGATIVE_FUNDING_SQUEEZE   → Short squeeze trap alpha              │
│  ├─ WHALE_EXIT_TRAP            → Distribution into retail bids         │
│  ├─ FLOW_ABSORPTION            → Institutional VPIN accumulation       │
│  ├─ LIQUIDATION_FLUSH_REVERSAL → Cascade bottom mean-reversion         │
│  └─ MOMENTUM_EXPANSION         → Q1 capital inflow continuation        │
│                                                                        │
│  LAYER 4 — NON-CUSTODIAL BLUEPRINT GENERATOR                           │
│  ├─ Limit Entry Zone, Hard Stop-Loss, TP1, TP2 (1:2.4 R/R)            │
│  ├─ decisionHash = SHA256(symbol + price + side + sl + tp1 + ts)       │
│  ├─ Claude Code CLI one-liner (natural language execution prompt)       │
│  ├─ Python CCXT snippet (BACKED does NOT touch funds — agent executes) │
│  └─ MCP Tool Call JSON (backed_calculate_intent_trade_setup)           │
│                                                                        │
│  LAYER 5 — UNIVERSAL MCP SERVER (/api/mcp — JSON-RPC 2.0)             │
│  ├─ backed_get_quant_alpha_signals   → 5 Quant models + visual charts  │
│  ├─ backed_get_market_overview       → Macro telemetry + Mermaid pie   │
│  ├─ backed_get_screener_all_contracts→ 718-contract screener + ranking │
│  ├─ backed_get_smart_money_intel     → Deep symbol alpha + trade setup │
│  ├─ backed_get_smart_money_clusters  → 50-Coin scatter clusters        │
│  ├─ backed_get_whale_exhaustion_signals → Whale trap front-run shield  │
│  ├─ backed_calculate_intent_trade_setup → Risk blueprint + Python CCXT │
│  └─ backed_smart_exit_whale_shield   → Position protection + derisking │
│                                                                        │
│  LAYER 6 — EDGE INFRASTRUCTURE (Vercel + In-Memory Cache)             │
│  ├─ 60s In-Memory Cache TTL → prevents redundant Binance calls         │
│  ├─ Cache-Control: s-maxage=60, stale-while-revalidate=120             │
│  ├─ Binance limit: 2,400 req/min → BACKED uses < 120/min (5%)         │
│  └─ 24/7 Cron via /api/run → Vercel Cron + Uptime keep-alive          │
└────────────────────────────────────────────────────────────────────────┘
```

### Web Terminal — 4 Live Tabs (`web/app/page.tsx`)

| Tab | Component | What It Does |
|---|---|---|
| **Market Overview** | `market-overview.tsx` | Macro Binance Futures dashboard: total volume, total OI (USD), liquidations, global long/short breadth across 700+ contracts |
| **Token Screener** | `token-screener.tsx` | Real-time search and filter table across all 718 USDT perpetual contracts with sorting by OI, funding, volume, and Top Trader bias |
| **Smart Money** | `smart-money.tsx` | 50-coin institutional positioning scatter plot — maps Top Trader long% vs Taker flow aggression to visualize where whales are positioned |
| **Quant Alpha & Workflows** | `quant-alpha-section.tsx` | Full quant terminal: Live Alpha Radar (5-model filter), Deep Quant Inspector (4-quadrant badge, VPIN, thesis, blueprint), 1-click agent execution tabs (Claude Code / Python / MCP) |

### API Routes (`web/app/api/`)

| Route | Status | Purpose |
|---|---|---|
| `/api/alpha/signals` | **Live** | Core quant alpha engine — scans top 40 contracts, computes all 5 quant models, returns signals with blueprints |
| `/api/mcp` | **Live** | Universal JSON-RPC 2.0 MCP server — 8 tools for external agents (Claude Code, Claude.ai, Hermes) with visual charts |
| `/api/market/overview` | **Live** | Aggregate macro futures stats — total volume, OI, liquidations |
| `/api/screener` | **Live** | 718-contract live screener with derivatives metrics per symbol |
| `/api/intel` | **Live** | Deep single-symbol derivatives intelligence + corroborated spot price |
| `/api/copilot` | **Live** | Universal intent engine — parses natural language queries into structured alpha responses |
| `/api/run` | **Live** | 24/7 autonomous pipeline cron runner |
| `/api/openapi.json` | **Live** | OpenAPI 3.1 spec for Codex / Custom GPTs |
| `/api/trade/execute` | Scaffolded | Non-custodial execution blueprint route (external agents call their own exchange) |
| `/api/trade/close` | Scaffolded | Non-custodial close blueprint route |

---

## 3. Instant Connect with External Agents (MCP)

### Claude Code (Terminal CLI)
Connect BACKED to your Claude Code environment in one command:
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

### Available MCP Tools (All Sections + Visual Charts)

Every tool returns structured machine-readable JSON for autonomous bots **plus** visual Mermaid pie charts and Unicode ASCII progress bars for human-in-the-loop chat interfaces.

| Tool Name | Section Covered | What It Does & What It Returns |
|---|---|---|
| `backed_get_quant_alpha_signals` | **Quant Alpha & Workflows** | Continuous surveillance of 718 contracts across 5 institutional models. Returns real-time VPIN toxicity, Margin Beta, 4-Quadrant Velocity, $+EV\%$, non-custodial limit entry/SL/TP blueprints, Claude Code commands, Python CCXT snippets, ASCII toxicity bar chart, and Mermaid model distribution pie chart. |
| `backed_get_market_overview` | **Market Overview** | Macro Binance Futures intelligence: total volume, total OI in USD, liquidations, Fear & Greed index, top gainers/losers, with Mermaid Long vs Short breadth pie chart and ASCII positioning bar chart. |
| `backed_get_screener_all_contracts` | **Token Screener** | 24/7 smart money screener across all 718 Binance perpetual contracts. Filter by institutional regime, volume, Top Trader ratio, taker ratio, and funding rate with ASCII volume rank bar charts. |
| `backed_get_smart_money_intel` | **Symbol Deep Dive** | Deep symbol derivatives snapshot (e.g. BTCUSDT, SOLUSDT, ETHUSDT) with Binance vs Coinbase spot corroboration, VPIN score, 4-Quadrant velocity, and pre-formatted CCXT order snippet. |
| `backed_get_smart_money_clusters` | **Smart Money** | 50-coin institutional positioning cluster intelligence (Scatter Plot). Identifies Smart Accumulation vs Distribution Trap clusters with Mermaid pie chart and ASCII accumulation bar chart. |
| `backed_get_whale_exhaustion_signals` | **Whale Trap Shield** | 24/7 scanning for trapped retail longs and institutional exhaustion so agents can front-run distribution and safely exit or hedge open positions. |
| `backed_calculate_intent_trade_setup` | **Execution Blueprints** | Non-custodial precision risk blueprints (optimal limit entry range, hard SL, TP1, TP2, R/R 1:2.4+, expected value $+EV\%$) with ready-to-execute Python CCXT and Claude Code snippets. |
| `backed_smart_exit_whale_shield` | **Position Protection** | Calculates smart exit parameters and realized PnL estimates for position derisking. |

---

## 4. Non-Custodial Agent Trading Workflows

BACKED does **not** buy, sell, or hold any funds. External agents take our institutional alpha and execute orders directly on their own exchange accounts:

### 1. Claude Code Terminal Workflow
```bash
claude "Scan BACKED MCP for institutional alpha signals with positive EV and execute the highest conviction long on Binance Futures with 2% risk"
```

### 2. Python CCXT Autonomous Bot
```python
import ccxt
# External bot receives parameters from BACKED MCP tool: backed_calculate_intent_trade_setup
exchange = ccxt.binanceusdm({'apiKey': 'YOUR_KEY', 'secret': 'YOUR_SECRET'})
order = exchange.create_order('SOLUSDT', 'limit', 'buy', 1.5, 134.20, {'stopLossPrice': 131.80})
```

### 3. Visual Charts in Agent Chat
When agents query BACKED tools, MCP automatically delivers:
- **Mermaid Pie Charts**: Rendered inline as interactive graphical pie charts in Claude Desktop, Cursor, and markdown interfaces.
- **Unicode ASCII Bar Charts**: Formatted horizontal progress bars for quick terminal inspection of VPIN toxicity, market breadth, and volume distribution.

---

## 5. Quickstart (Local Development)

```bash
# 1. Clone Repository
git clone https://github.com/samixrd/backed.git
cd backed

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
│   │   ├── page.tsx         # Main Dashboard Layout with 4 institutional tabs
│   │   └── api/
│   │       ├── alpha/signals# Institutional Quant Alpha API (VPIN, Beta, Quadrants)
│   │       ├── mcp/         # Official MCP Server (JSON-RPC 2.0)
│   │       ├── openapi.json/# OpenAPI 3.1 Spec for Codex / GPTs
│   │       ├── market/      # Whole-market overview & aggregate futures telemetry
│   │       ├── screener/    # 718 perpetual contracts live screener
│   │       ├── copilot/     # Universal Intent Copilot API
│   │       └── run/         # End-to-end 24/7 pipeline cron runner
│   └── components/
│       ├── hero.tsx                 # Binance Agent OS Spotlight Hero
│       ├── quant-alpha-section.tsx  # Quant Alpha Radar, Inspector & Blueprints
│       ├── market-overview.tsx      # Macro futures volume, open interest & breadth
│       ├── token-screener.tsx       # 718-contract search & multi-metric filter table
│       ├── smart-money.tsx          # 50-coin institutional positioning scatter plot
│       ├── connect-modal.tsx        # Binance Agent OS Session Manager
│       └── mcp-integrate-modal.tsx  # Claude/Cursor/Grok/Hermes integration modal
├── test/                    # 25 automated unit tests
├── AGENTS.md                # Binance Agent OS runtime instructions & core principles
├── DATA_SOURCES.md          # Real-time market endpoints specification
├── PROVABLE_ALPHA_SPEC.md   # Cryptographic architecture specification
└── REBUILD_PLAN.md          # Migration & architecture milestone history
```
