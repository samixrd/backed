# Data Sources & Runtime — Provable Alpha

> Free / no-key data endpoints + Azure VM runtime + GPT-4o-mini reasoning. Everything here is
> real and usable with no paid API key. Sentiment/price cross-checks are multi-source — that's
> what makes our evidence high-quality (not single-source, which a judge can poke).

## Architecture (Azure VM + Agent OS + GPT-4o-mini)

```
[ Azure VM — Agent OS runtime ]
   ├── OpenAI GPT-4o-mini ............ strategy reasoning (local agent, IP stays here)
   ├── Binance MCP Server (agentic) .. market data + trade (sub-account)
   ├── Data Store (co-pilot) ......... evidence store + provenance ledger
   ├── BSC testnet RPC ............... onchain anchor (commit-hash)
   └── Verifier Agent ................ re-audit any agent's record
```

### Why Azure VM
- Agent runs 24/7 (not your laptop) — autonomy + continuity.
- GPT-4o-mini call + evidence indexing + hashing all on one box.
- Testnet / demo: no real funds needed for the anchor (testnet BNB).

## Free Data Sources (no API key)

### 1. Binance Public API — primary market/derivatives data
- Spot ticker: `GET https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT`
- Futures funding rate: `GET https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT`
- Klines: `GET https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=1h&limit=5`
- Order book depth: `GET https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=10`
- **No key required** — this is the authoritative "observed" price for a decision.

### 2. CoinGecko — cross-check (2nd source, corroboration)
- `GET https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`
- Free tier (rate-limited ~10-30 req/min). Used ONLY to corroborate Binance price.
- Multi-source rule: decision only fires if Binance + CoinGecko agree within a tolerance.

### 3. alternative.me Fear & Greed Index — sentiment
- `GET https://api.alternative.me/fng/?limit=1`
- Free JSON. Adds a sentiment feature input → stronger evidence provenance.

### 4. BSC mainnet RPC (public) — onchain state / contract reads
- `https://bsc-dataseed.binance.org` (public) — read-only contract/state queries if needed.

### 5. BSC testnet RPC + faucet — onchain anchor (commit hash)
- RPC: `https://data-seed-prebsc-1-s1.bnbchain.org:8545` (testnet)
- Faucet: BNB testnet faucet → free test BNB (public faucet, no key).
- The agent submits a tiny commit tx (hash-chain head / merkle root) → **real timestamp proof**.
- This is the "Provable Alpha" integrity root. Testnet = free + honest.

## `reasonHash` — IP preservation with GPT-4o-mini
- GPT-4o-mini generates the reasoning string (data interpret + decision rationale).
- We hash that string to `reasonHash` and **discard** the string immediately.
- The reasoning NEVER leaves the agent's memory; only the hash lands in the record.

> REQUIRES VERIFICATION: (a) exact Binance MCP tool names + response schemas for market-data /
> account / trade in the connected client; (b) whether Agent OS agents inherit the MCP
> "confirm before execute" for trades or can place orders autonomously with account API keys;
> (c) exact onchain-workflows MCP tool for committing an anchor tx. Mark these once confirmed.
