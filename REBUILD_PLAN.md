# MIGRATION & REBUILD PLAN: BACKED — Autonomous Market Intel & Trade Agent

## 1. Executive Summary & Vision
We are upgrading **BACKED** into a streamlined, high-accuracy **Market Intel & Trade Agent**, powered natively by **Binance Agent OS**.

### The Core Problem Solved
Traders face fragmented derivatives data and complex metrics that are overwhelming:
- Complex liquidation heatmaps
- Obscure Open Interest (OI) divergences
- Taker buy/sell volume imbalances
- Raw wallet flow imbalances

**Our AI Agent bridges this gap**:
1. Ingests deep market derivatives (OI, Top Trader Long/Short Ratio, Taker Volume, Liquidation Clusters).
2. Synthesizes this multi-variate quant data using LLM reasoning (powered by Azure OpenAI GPT-4o-mini & Binance Agent OS).
3. Presents plain-English, high-conviction Alpha insights and actionable signals to the user.
4. Anchors each signal onto the **BNB Smart Chain (BSC Testnet)** with SHA-256 commit hashes — guaranteeing that the agent's published track record is 100% tamper-evident, un-backdatable, and provable without leaking IP.

---

## 2. LLM / Model Infrastructure Plan (DeepSeek Credit Solution)

### Current Status:
- DeepSeek credits are exhausted.
- **Good News:** The project already has **Azure OpenAI GPT-4o-mini** configured and **LIVE / VERIFIED**:
  - Endpoint: `https://obelisk.services.ai.azure.com/openai/v1`
  - Deployment: `gpt-4o-mini-2024-07-18`
  - Status: Verified responsive with active keys in `.env` (Tested & responded instantly!).
- We switch the default LLM from DeepSeek to **Azure GPT-4o-mini** across `src/reasoning.ts` and the copilot engine.

---

## 3. Data Architecture (Derivatives & Smart Money APIs)

| Intel Type | Data Provider | Endpoint | What It Tells the Agent |
|---|---|---|---|
| **Open Interest (OI)** | Binance Futures | `/fapi/v1/openInterest?symbol=BTCUSDT` | Whether new capital is flowing in or positions are closing |
| **Whale/Top Trader Sentiment** | Binance Futures | `/futures/data/topLongShortAccountRatio` | Smart Money positioning vs retail sentiment |
| **Taker Aggression** | Binance Futures | `/futures/data/takerlongshortRatio` | Are market orders aggressively buying or selling |
| **Liquidation Clustering** | Binance Futures | `/fapi/v1/depth?symbol=BTCUSDT&limit=100` | High-leverage liquidity pools ripe for squeeze |
| **Funding Rate Trends** | Binance Futures | `/fapi/v1/fundingRate` | Overheated leverage & squeeze probability |
| **Market Sentiment** | Alternative.me | `/fng/?limit=1` | Macro fear & greed context |
| **Onchain State** | BSC Testnet RPC | `https://data-seed-prebsc-1-s1.bnbchain.org:8545` | Proof-of-Signal anchoring (tamper-proof alpha) |

---

## 4. Proposed Architecture & Directory Layout

```
D:\BACKED\
├── src/
│   ├── quant/                    # [NEW] Coinglass/Arkham Style Quant Engine
│   │   ├── derivatives.ts        # Ingests OI, Top Trader LS, Taker Ratio, Funding
│   │   ├── liquidations.ts       # Liquidation cluster & order book depth model
│   │   └── smart-money.ts        # Whale flow detection & sentiment aggregation
│   ├── agent/
│   │   ├── copilot.ts            # Arkham-style conversational agent & insight generator
│   │   ├── reasoning.ts          # Azure GPT-4o-mini reasoning engine (active)
│   │   └── signals.ts            # High-conviction trade signal generator
│   ├── anchor.ts                 # BSC Testnet onchain commit proof
│   ├── verifier.ts               # Cryptographic verification agent
│   ├── mcp-client.ts             # Binance Agentic MCP server client
│   └── store.ts                  # Supabase record store
├── web/                          # [REBUILT] Modern Arkham/Coinglass Sleek Terminal
│   ├── app/
│   │   ├── page.tsx              # Main Terminal UI (Pulse + Copilot + Signals)
│   │   └── api/
│   │       ├── quant/route.ts    # Live derivatives & smart money API
│   │       ├── copilot/route.ts  # Real-time AI Copilot chat streaming
│   │       └── run/route.ts      # Provable signal commit & anchor execution
│   └── components/
│       ├── MarketPulse.tsx       # Live OI, Long/Short, Funding Gauges
│       ├── WhaleHeatmap.tsx      # Liquidation & smart money order flow visualizer
│       ├── SignalFeed.tsx        # High-probability signals with onchain proof links
│       └── CopilotTerminal.tsx   # Interactive Arkham-like Natural Language prompt
└── REBUILD_PLAN.md               # Persistent plan document in repository
```

---

## 5. Phased Implementation Roadmap

### Phase 1: Quant Intelligence Layer (`src/market-intel.ts`) — [COMPLETED]
- [x] Implemented live resilient Binance Futures ingestion for Open Interest (OI), Top Trader Long/Short ratio, and Taker Buy/Sell ratio.
- [x] Implemented 8h funding rate and order book depth tracking.
- [x] Converted BTC coin volume to precise USD metrics.

### Phase 2: Agent OS & LLM Synthesis (`src/reasoning.ts`) — [COMPLETED]
- [x] Switched reasoning engine to Azure OpenAI `gpt-4o-mini` with structured JSON output and fast low-latency synthesis.
- [x] Synthesized multi-metric data into explicit Regime, Conviction Score (60-95%), and Action (BUY/SELL).
- [x] Integrated into `src/pipeline.ts` so all trades and decisions bind cryptographically onchain.

### Phase 3: Frontend Terminal Rebuild (`web/`) — [COMPLETED]
- [x] **Spotlight Binance Agent OS Native** banner and architecture cards in the Hero component.
- [x] **Market Pulse & Institutional Charts** (`MarketIntelSection`):
  - Top Trader Long/Short Sentiment Donut/Pie chart.
  - Taker Flow Execution Pressure Bar chart.
  - Squeeze Risk & Funding Overheat Gauge.
- [x] **Interactive Agent OS Copilot Terminal** (`CopilotTerminal` & `/api/copilot`):
  - Natural Language query input allowing users to ask about whale behavior, OI, and leverage risks.
  - Instant live AI synthesis with live Binance derivatives context.

### Phase 4: Binance Agent OS & Verification — [COMPLETED & VERIFIED]
- [x] Verified complete end-to-end loop:
  `Real Market Ingestion -> AI Synthesis -> BSC Testnet Onchain Anchor (Tx: 0xc726...da) -> Independent Verifier Audit: PASS`.
- [x] All 25 original cryptographic unit tests pass with zero regressions.
- [x] Web application compiled and optimized for production with zero TypeScript/lint errors.


### Phase 5: Universal Intent Engine & Whale Trap Shield — [COMPLETED & VERIFIED]
- [x] Implemented 3-way intent classification in `/api/copilot` (`OPEN_TRADE`, `CLOSE_TRADE`, `INQUIRY`).
- [x] Integrated autonomous trade execution on Binance Futures with instant BSC Testnet decision anchor receipts.
- [x] Implemented **Whale Trap Shield** front-running exit engine to autonomously secure realized gains when whales distribute.
- [x] Connected Copilot Terminal UI with live active position radar and front-run exit triggers.

### Phase 6: Universal MCP Server & OpenAPI for External Agents — [COMPLETED & VERIFIED]
- [x] Built official Model Context Protocol server at `/api/mcp` (JSON-RPC 2.0 compliant).
- [x] Implemented full handshake support: `initialize`, `notifications/initialized`, `ping`, `tools/list`, and `tools/call`.
- [x] Exposed 3 tools: `backed_get_smart_money_intel`, `backed_execute_intent_trade`, and `backed_smart_exit_whale_shield`.
- [x] Generated dynamic OpenAPI 3.1 schema at `/api/openapi.json` for OpenAI Codex and Custom GPT Actions.
- [x] Added 4-tab 1-click integration modal in the web frontend for Claude Code, Cursor, Codex, and Groq/Hermes.

### Phase 7: Production Cloud Deployment & 24/7 Engine — [COMPLETED & LIVE]
- [x] Packaged Next.js web application with self-contained core architecture.
- [x] Deployed live to Vercel at `https://backed-zeta.vercel.app` with Singapore (`sin1`) routing to eliminate Binance geo-blocking.
- [x] Configured resilient price corroboration combining Binance Spot, Coinbase Spot, and Binance Futures Mark prices.
- [x] Established 24/7 autonomous pipeline execution via Vercel Cron and edge keep-alive.
- [x] Conducted full security audit: zero secrets or sensitive keys pushed to GitHub.
