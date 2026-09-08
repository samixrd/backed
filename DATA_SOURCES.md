# DATA_SOURCES.md — Real-Time Market Intel & Derivatives Architecture

> High-accuracy, real-time market data endpoints powering the **BACKED 24/7 Autonomous Market Intel & Quant Alpha Oracle** on **Binance Agent OS**.
> 100% non-custodial, free and public Binance Futures & Spot endpoints requiring zero paid API keys, backed by resilient secondary price corroboration and edge-cached rate limit protection.

---

## 1. Live Market Derivatives Endpoints (Binance Futures)

All endpoints run against authoritative Binance infrastructure with resilient direct HTTP/HTTPS fallback in Singapore (`sin1`) to eliminate geo-blocking:

| Intel Parameter | Live Binance Endpoint | What It Measures |
|---|---|---|
| **718 Perpetual Tickers** | `https://fapi.binance.com/fapi/v1/ticker/24hr` | Real-time prices, 24h % change, quote volume across all 718 USDT perps |
| **Open Interest (OI)** | `https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT` | Total open contracts in base & USD (institutional capital inflow) |
| **Top Trader Long/Short Bias** | `https://fapi.binance.com/futures/data/topLongShortAccountRatio?symbol=BTCUSDT&period=5m&limit=1` | Smart money positioning (ratio of top accounts net long vs short) |
| **Taker Aggression Flow** | `https://fapi.binance.com/futures/data/takerlongshortRatio?symbol=BTCUSDT&period=5m&limit=1` | Aggressive market buy volume vs market sell volume imbalance |
| **Premium & Funding Rate** | `https://fapi.binance.com/fapi/v1/premiumIndex` | 8h funding rate, predicted funding, and mark price premium |
| **Orderbook Depth** | `https://fapi.binance.com/fapi/v1/depth?symbol=BTCUSDT&limit=50` | Real-time bid/ask liquidity support and squeeze clustering |

---

## 2. Derived Quantitative Models & Formulas

Rather than relying solely on raw data, BACKED processes derivatives into institutional quantitative alpha indicators:

### 2.1 VPIN (Volume-Synchronized Probability of Toxicity)
$$\text{VPIN} = \frac{|\text{TakerBuyVol} - \text{TakerSellVol}|}{\text{TotalTakerVol}}$$
Measures the proportion of aggressive volume from informed participants picking off passive liquidity depth. Values $> 0.25$ indicate aggressive toxic institutional absorption.

### 2.2 Top Trader Margin Beta ($\beta_{\text{TT}}$ Divergence)
$$\beta_{\text{TT}} = \frac{\text{TopTraderLongPct} - 50}{10}$$
Quantifies institutional whale bias relative to retail positioning. Negative values indicate whale shorting into retail longs; high positive values indicate aggressive institutional accumulation.

### 2.3 4-Quadrant Velocity Matrix
Maps the contract into one of four distinct market regimes:
- **$Q_1$ Capital Expansion:** $\Delta P > 0 \land \Delta \text{OI} > 0$ (High Conviction Long Momentum)
- **$Q_2$ Short-Covering Exhaustion:** $\Delta P > 0 \land \Delta \text{OI} \le 0$ (Short Squeeze Exhaustion / Distribution Trap)
- **$Q_3$ Institutional Shorting:** $\Delta P < 0 \land \Delta \text{OI} > 0$ (Institutional Short Breakdown)
- **$Q_4$ Liquidation Flush Bottom:** $\Delta P < 0 \land \Delta \text{OI} \le 0$ (Capitulation Mean Reversion Long)

### 2.4 Statistical Expected Value ($+EV\%$)
$$EV = (P_{\text{win}} \times \text{TP}_1) - ((1 - P_{\text{win}}) \times \text{SL})$$
Every blueprint requires $+EV > 0$ before broadcast.

---

## 3. Multi-Source Price Corroboration (Provenance Layer)

To ensure the agent never acts on single-source or hallucinated prices, every decision requires price alignment across independent venues:

- **Primary Source (Binance Spot):** `https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT`
- **Secondary Source (Coinbase Spot):** `https://api.coinbase.com/v2/prices/BTC-USD/spot`
- **Tertiary Fallback (Binance Futures Mark):** `https://fapi.binance.com/fapi/v1/ticker/price?symbol=BTCUSDT`
- **Market Sentiment:** Alternative.me Crypto Fear & Greed Index (`https://api.alternative.me/fng/?limit=1`)

> **Corroboration Threshold:** The agent requires `tolerance <= 0.5%` maximum deviation between venues before generating an evidence hash. If sources diverge beyond 0.5%, the decision pipeline halts with an explicit provenance alert.

---

## 4. Rate-Limit Protection & Edge Caching Architecture

Binance enforces a strict 2400/min weight limit on public endpoints. BACKED employs an institutional caching hierarchy:

- **Server-Side In-Memory Cache:** 60-second TTL prevents repeated API calls during concurrent client requests.
- **Edge Cache:** `Cache-Control: public, s-maxage=60, stale-while-revalidate=120`. Sub-5ms edge response worldwide.
- **Consumption Safety:** Under heavy external agent and hackathon judge traffic, total outbound requests to Binance remain under 120/min (< 5% of weight limit).

---

## 5. Non-Custodial Workflow Dispatch

Every signal computed by the quant engine is packaged into a ready-to-execute blueprint for external agents. BACKED does not execute any trades.

| Workflow Format | Description |
|---|---|
| **Claude Code CLI** | Natural language prompt: `claude "Execute LONG setup on BTCUSDT: Entry ~price, SL stop, TP target"` |
| **Python CCXT Snippet** | Pre-filled `ccxt.binanceusdm` order with symbol, side, price, stopLossPrice — agent pastes their own API key |
| **MCP Tool Call JSON** | `backed_calculate_intent_trade_setup` — structured JSON-RPC call any agent can invoke directly |

All blueprint parameters (entry range, stop-loss, take-profit, R/R ratio, +EV%) are derived purely from live Binance Futures data and the quant computation layer above. No hallucinated prices. No manual overrides.
