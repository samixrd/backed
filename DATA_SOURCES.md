# DATA_SOURCES.md — Real-Time Market Intel & Derivatives Architecture

> High-accuracy, real-time market data endpoints powering the **BACKED Autonomous Market Intel & Trade Agent**.
> 100% free and public Binance Futures & Spot endpoints requiring zero paid API keys, backed by resilient secondary price corroboration.

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

## 2. Multi-Source Price Corroboration (Provenance Layer)

To ensure the agent never acts on single-source or hallucinated prices, every decision requires price alignment across independent venues:

- **Primary Source (Binance Spot):** `https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT`
- **Secondary Source (Coinbase Spot):** `https://api.coinbase.com/v2/prices/BTC-USD/spot`
- **Tertiary Fallback (Binance Futures Mark):** `https://fapi.binance.com/fapi/v1/ticker/price?symbol=BTCUSDT`
- **Market Sentiment:** Alternative.me Crypto Fear & Greed Index (`https://api.alternative.me/fng/?limit=1`)

> **Corroboration Threshold:** The agent requires `tolerance <= 0.5%` maximum deviation between venues before generating an evidence hash. If sources diverge beyond 0.5%, the decision pipeline halts with an explicit provenance alert.

---

## 3. Onchain Anchoring & Settlement (BNB Smart Chain)

- **Network:** BNB Smart Chain (BSC Testnet)
- **Chain ID:** `97`
- **RPC:** `https://data-seed-prebsc-1-s1.binance.org:8545`
- **Explorer:** [https://testnet.bscscan.com](https://testnet.bscscan.com)
- **Commit Payload:** `0x` + 32-byte SHA-256 digest of canonical decision and reasoning hashes.
- **Proof:** Immutable block timestamp proof anchors the trade intent prior to execution.
