<div align="center">
  <img src="https://backed-zeta.vercel.app/logo.png" width="120" height="120" alt="BACKED Logo" style="border-radius: 50%;" />
  <h1>BACKED — 24/7 Autonomous Market Intel & Quant Alpha Oracle</h1>
  <p><strong>Institutional-grade market intelligence, quantitative alpha models, and provable non-custodial workflows on BNB Smart Chain — powered natively by Binance Agent OS.</strong></p>
  <p>Built for the <strong>Binance Agent OS Hackathon</strong> (Track A & B: AI Agents + Data & Analysis + Trading Workflows)</p>
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

Most retail traders and autonomous agents are overwhelmed by complex derivatives metrics, and nobody can verify if an agent's claimed track record is authentic or backdated.

**BACKED solves this as a 24/7 Non-Custodial Intelligence & Alpha Provider on Binance Agent OS**:

1. **100% Non-Custodial Operation:** BACKED does **NOT** buy, sell, or hold user assets. External agents (Claude Code, Cursor, Codex, Grok, Hermes, Python CCXT bots) ingest our institutional signals and execute directly on their own exchange accounts.
2. **Whole-Market 718-Contract Coverage:** Ingests live Binance Futures Open Interest (USD), Top Trader Long/Short account ratios, and Taker Buy/Sell volume flow across all 718 USDT perpetual contracts.
3. **Hardcore Quant Mathematical Models:**
   - **VPIN (Volume-Synchronized Probability of Toxicity):** Detects aggressive institutional capital picking off passive orderbook liquidity.
   - **Top Trader Margin Beta ($\beta_{\text{TT}}$ Divergence):** Quantifies whale accumulation vs retail trap positioning.
   - **4-Quadrant Velocity Matrix:** Categorizes market momentum into $Q_1$ Capital Expansion, $Q_2$ Short-Covering Exhaustion, $Q_3$ Institutional Short Breakdown, and $Q_4$ Liquidation Flush Reversal.
   - **Basis Dislocation & Funding Gamma Squeeze:** Detects negative funding ($< -0.005\%$) and spot-futures basis spreads.
   - **Statistical Expected Value ($+EV\%$):** Mathematically verifies positive expectation before dispatching blueprints.
4. **1-Click External Agent Blueprints:** Every signal provides instant executable workflows for Claude Code CLI, Python CCXT, and MCP tool invocations with predefined limit entry zones, hard stop-losses, and multi-tier take-profits.
5. **Provable Alpha on BSC Testnet:** Every trade thesis is hashed (`SHA256`) and anchored onto the **BNB Smart Chain (BSC Testnet)** before broadcast. Immutable block timestamps provide tamper-evident mathematical proof against backdating without leaking strategy IP.
6. **Universal Model Context Protocol (MCP):** Any external coding or reasoning agent connects to BACKED via JSON-RPC 2.0 with a single command.

---

## 2. Core Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BINANCE AGENT OS RUNTIME                        │
│                                                                        │
│   [ Live Market Screener ]         [ Institutional Quant Models ]      │
│   718 Binance Perpetual Contracts  VPIN Toxicity Flow Index            │
│   Top Trader Long/Short Bias  ──>  Top Trader Margin Beta (Divergence) │
│   Taker Flow Aggression Imbalance  4-Quadrant Velocity State Engine    │
│   Open Interest in USD             Basis Dislocation & Funding Squeeze │
│                                                                        │
│   [ Non-Custodial Blueprints ]     [ Provable BSC Testnet Anchor ]     │
│   Calculates Limit Entry Zone      decisionHash = SHA256(canonical)   │
│   Hard Stop-Loss & Take-Profit     reasonHash   = SHA256(reasoning)    │
│   Statistical +EV% Verification    Zero IP Leakage / Anti-Backdating   │
│                                                                        │
│   [ Universal MCP Server ]         [ Edge-Optimized Infrastructure ]   │
│   Claude Code / Cursor / Codex     60s In-Memory Cache TTL             │
│   Grok (xAI) / Hermes / CCXT       Vercel Edge Stale-While-Revalidate  │
│   Protocol: JSON-RPC 2.0 (v2)      Zero 429 Rate-Limit / Free-Tier Safe│
└────────────────────────────────────────────────────────────────────────┘
```

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

### Available MCP Tools

| Tool Name | What It Does |
|---|---|
| `backed_get_market_overview` | 24/7 global Binance Futures market intelligence (total volume, OI in USD, liquidations, sentiment). |
| `backed_get_screener_all_contracts` | 24/7 smart money screener scanning all 718 Binance perpetual contracts. Filter by institutional regime, Top Trader ratio, and Taker flow. |
| `backed_get_smart_money_intel` | Deep institutional derivatives intelligence for any specific symbol (e.g. BTCUSDT, SOLUSDT, ETHUSDT) with corroborated spot pricing. |
| `backed_get_whale_exhaustion_signals` | 24/7 Whale Trap Shield scanning contracts for resistance exhaustion and impending sell dumps. |
| `backed_calculate_intent_trade_setup` | Generates non-custodial risk blueprints (entry range, stop-loss, targets, $+EV\%$) with BSC Testnet anchor hash for external agent execution. |

---

## 4. Live Onchain Proofs (BNB Smart Chain)

Every trade setup and decision is anchored onchain before broadcast. Inspect recent live transactions on BSC Testnet:

- **SOL Intent Anchor:** [`0x22ecef7c7b9f3bb0372b8103c921092b78c2044378932611ab8c4d3aa58c358e`](https://testnet.bscscan.com/tx/0x22ecef7c7b9f3bb0372b8103c921092b78c2044378932611ab8c4d3aa58c358e)
- **Whale Shield Exit Anchor:** [`0xec20ddbdf187517c8d4f94537506b643321cee9a86c06e7c1da1444556e65e13`](https://testnet.bscscan.com/tx/0xec20ddbdf187517c8d4f94537506b643321cee9a86c06e7c1da1444556e65e13)
- **Chain ID:** `97` (BNB Smart Chain Testnet)

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
├── DEMO_SCRIPT.md           # 90-second hackathon presentation script
├── PROVABLE_ALPHA_SPEC.md   # Cryptographic architecture specification
└── REBUILD_PLAN.md          # Migration & architecture milestone history
```
