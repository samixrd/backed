# BACKED — Autonomous Market Intel & Trade Agent

> **Institutional-grade market intelligence and trading execution, powered natively by Binance Agent OS.**
> Built for the **Binance Agent OS Mini Hackathon · Track A & B** (AI Agents + Data & Analysis + Trading Workflows).

---

## 1. What is BACKED?

Every AI claims high accuracy, but everyday traders are overwhelmed by complex derivatives metrics, and nobody can verify if an agent's claimed track record is real or backdated.

**BACKED bridges this gap**:
1. **Real Market Intel:** Ingests live Binance Futures Open Interest (OI), Top Trader Long/Short Sentiment, Taker Buy/Sell aggression pressure, and 8h funding rates directly from Binance.
2. **AI Copilot & Synthesis:** Powered by Azure OpenAI GPT-4o-mini & Binance Agent OS, translating raw multi-metric data into crystal-clear market regimes, conviction scores, and actionable signals.
3. **Provable Alpha (Onchain Anchor):** Before execution, every decision is cryptographically hashed (`SHA256`) and anchored onto the **BNB Smart Chain (BSC Testnet)** as a permanent timestamp proof. No backdating, no tampering, zero IP leaks.
4. **Independent Verifier Audit:** An embedded Verifier agent mathematically audits chain continuity, evidence hashes, and block times (`PASS` / `FAIL`).

---

## 2. Core Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BINANCE AGENT OS RUNTIME                        │
│                                                                        │
│   [ Live Market Intel ]            [ Azure GPT-4o-mini Brain ]         │
│   Binance Futures OI               Synthesizes Multi-Metric Flow       │
│   Top Trader Long/Short Bias  ──>  Detects Market Regimes (Squeeze/    │
│   Taker Flow Aggression            Accumulation/Distribution)          │
│   8h Funding & Depth               Calculates Conviction (60-95%)      │
│                                                                        │
│   [ Provable Alpha Engine ]        [ Onchain Anchor (BSC Testnet) ]    │
│   decisionHash = SHA256(decision)  Anchored via real transaction:      │
│   reasonHash   = SHA256(reasoning) Tx: 0xc72698be...60b670da           │
│   (Strategy IP is never stored)    Block timestamp = Anti-Backdating   │
│                                                                        │
│   [ Independent Verifier Agent ]   [ Institutional Dark Terminal ]     │
│   Recomputes hashes & verifies     Donut & Bar Charts (Donut, Taker,   │
│   chain continuity → PASS / FAIL   Leverage Gauge, AI Copilot Input)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack & Integrations

- **Agent Runtime:** Binance Agent OS & Codex CLI
- **Market Data Protocol:** Official Binance Agentic MCP (`https://agent.binance.com/mcp/agentic`) + Binance Futures Public API
- **Reasoning Engine:** Azure OpenAI (`gpt-4o-mini-2024-07-18`) with structured JSON synthesis (Verified Live)
- **Onchain Anchoring:** BNB Smart Chain (BSC Testnet) via JSON-RPC
- **Database & Storage:** Supabase (`backed` schema) + LocalStore resilience
- **Frontend Dashboard:** Next.js 14, Tailwind CSS, Editorial Dark Theme (`#0b0c0e`, `#c9a227` brass accent), SVG Institutional Charts

---

## 4. Live Verification Output

Running the full autonomous pipeline (`node dist/src/pipeline.js`):

```bash
>>> 1. INGESTION & ANCHORING VIA PIPELINE...
STATUS: SUCCESS
Symbol: BTCUSDT
Corroborated Price: $79,071.00 (Binance Spot + CoinGecko)
Open Interest: $8.53B USD (107,954 BTC)
Top Trader Ratio: 55.6% Long vs 44.4% Short (1.25x Long Bias)
Taker Execution Pressure: 0.68x Buy/Sell Flow
Funding Rate: 0.0031%
Reasoning: "With a high sentiment score of 71, a majority long positioning at 55.6%, and a funding rate of 0.0031%, the market shows strong bullish momentum and potential for further upside."
Decision Hash: 7e4fcedce3936cd11b571a124d077cca1bfcde3904e9b620ed9a9f696c700c40
Anchor Tx: 0xc72698be7d6e261e384e74f69cc1dbdd5fe939c7884dd36ae52d9c6a60b670da (BSC Testnet)

>>> 2. RUNNING INDEPENDENT VERIFIER AUDIT...
AUDIT VERDICT: PASS
REASON: Record integrity verified — all checks passed
CHECKS: decisionHash:PASS | link:PASS | prevChain:PASS | evidence_bound:PASS | agent_bound:PASS
```

---

## 5. Quickstart & Commands

```bash
# 1. Install dependencies & build core
npm install
npx tsc -p tsconfig.json

# 2. Run all unit tests (25/25 passing)
npm test

# 3. Launch Web Terminal
cd web
npm install
npm run dev
# Open http://localhost:3000
```

---

## 6. Repository Layout

```
D:\BACKED\
├── src/
│   ├── market-intel.ts      # Live Binance Futures derivatives, OI, & Taker flow
│   ├── reasoning.ts         # Azure GPT-4o-mini structured intelligence engine
│   ├── pipeline.ts          # Autonomous fund loop (ingest -> reason -> anchor -> persist)
│   ├── anchor.ts            # BSC Testnet onchain commit proof
│   ├── verifier.ts          # Independent cryptographic audit agent
│   ├── datasource.ts        # Multi-source price corroboration (Binance + CoinGecko)
│   ├── canonical.ts         # Deterministic serialization (Trust Root)
│   ├── provable.ts          # SHA-256 hash-chaining and proof math
│   ├── mcp-client.ts        # Binance Agentic MCP client (OAuth + JSON-RPC)
│   └── store.ts             # Supabase (`backed` schema) + LocalStore
├── web/                     # Next.js Institutional Dark Terminal
│   ├── app/
│   │   ├── page.tsx         # Main Dashboard Layout
│   │   └── api/
│   │       ├── intel/       # Live derivatives API
│   │       ├── copilot/     # Natural Language AI Copilot API
│   │       └── run/         # End-to-end commit runner
│   └── components/
│       ├── hero.tsx                 # Binance Agent OS Spotlight Hero
│       ├── market-intel-section.tsx # Donut, Bar & Gauge SVG Charts
│       └── copilot-terminal.tsx     # Natural Language Agent OS Prompt
├── test/                    # 25 automated unit tests
└── REBUILD_PLAN.md          # Implementation verification record
```
