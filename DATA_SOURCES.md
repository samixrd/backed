# DATA_SOURCES.md — Real-Time Market Intel & Derivatives Architecture

> High-accuracy, real-time market data endpoints powering the **BACKED Autonomous Market Intel & Trade Agent**.
> 100% free and public Binance Futures & Spot endpoints requiring zero paid API keys.

---

## 1. Live Market Derivatives Endpoints (Binance Futures)

All endpoints run against authoritative Binance infrastructure with resilient direct HTTP/HTTPS fallback:

| Intel Parameter | Live Binance Endpoint | What It Measures |
|---|---|---|
| **Real-time Price & 24h Ticker** | `https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=BTCUSDT` | Last traded price, 24h % change, high/low |
| **Open Interest (OI)** | `https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT` | Total open contracts in BTC & USD (capital inflow) |
| **Top Trader Long/Short Bias** | `https://fapi.binance.com/futures/data/topLongShortAccountRatio?symbol=BTCUSDT&period=5m&limit=1` | Institutional & smart money account positioning |
| **Taker Aggression Flow** | `https://fapi.binance.com/futures/data/takerlongshortRatio?symbol=BTCUSDT&period=5m&limit=1` | Aggressive market buy vs market sell volume pressure |
| **8h Funding Rate** | `https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=1` | Overheated leverage & squeeze probability |
| **Orderbook Depth** | `https://fapi.binance.com/fapi/v1/depth?symbol=BTCUSDT&limit=50` | Bid/Ask liquidity support and squeeze clustering |

---

## 2. Multi-Source Corroboration (Provenance Layer)

- **Binance Spot API:** `https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT`
- **CoinGecko API:** `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`
- **Sentiment (Fear & Greed):** `https://api.alternative.me/fng/?limit=1`

> **Corroboration Rule:** The agent never acts on single-source spot prices. Evidence is accepted only when Binance Spot and CoinGecko agree within a \(\le 0.5\%\) tolerance threshold.

---

## 3. Onchain Anchoring & Verification

- **Chain:** BNB Smart Chain (BSC Testnet)
- **RPC:** `https://data-seed-prebsc-1-s1.bnbchain.org:8545`
- **Commit Payload:** `0x` + 32-byte decision SHA-256 hash.
- **Proof:** Immutable block timestamp proof anchors the trade intent prior to execution.
