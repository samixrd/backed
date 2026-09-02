# BACKED — Provable Alpha

> **AI agents prove their track record is real and unmodified — without revealing their strategy.**
> Built for the **Binance Agent OS Mini Hackathon · Track A** (build an AI agent with Agent OS).

---

## The problem

AI agents make confident claims with no cost to being wrong, and nobody can verify a claimed track
record. An agent can say "my strategy is great" — but the record can be fabricated, backdated, or
rewritten, and publishing the strategy leaks the edge.

Binance Agent OS offers a specific, real constraint: **it can't see an agent's reasoning — only its
settled trades.** That's normally treated as a risk. We treat it as the feature.

## The proof

> **"I can prove my agent really did what it says — without showing how it does it."**

BACKED produces a **crypto-verified, tamper-evident performance record** that is:

| Property | How it's guaranteed |
|---|---|
| **No fabrication** | Real market data (multi-source corroboration), real reasoning, real tx |
| **No backdating** | Decision hash anchored **onchain** before the action (timestamp proof) |
| **No tampering** | Hash-chain + a Verifier agent that recomputes every hash |
| **No IP leak** | Reasoning is hashed (`reasonHash`) then **discarded** — never stored or shown |

## The loop

```
RESEARCH  → real Binance market data (Agentic MCP / public REST) + corroboration
DECIDE    → free model reasoning (B.AI deepseek / Azure) → BUY or SELL
COMMIT    → decisionHash = SHA256(canonical(decision))
            reasonHash   = SHA256(reasoning)   ← reasoning NEVER stored
            → anchor hash ONCHAIN (BSC testnet) → timestamp proof
            → persist to Supabase (backed schema)
VERIFY    → Verifier agent re-audits: chain continuity + ordering + evidence binding
            → PASS (genuine) or FAIL (tampered)
REPORT    → symbol, side, decisionHash, anchorTx, verdict
```

## Agent OS integration (real, verified)

The agent runs inside **Codex CLI** and reaches Binance through the official **Binance Agentic MCP
server** (`https://agent.binance.com/mcp/agentic`) using the whitelisted `codex` OAuth client_id.

```bash
# Binance MCP server registered + OAuth-logged-in (codex client_id)
codex mcp add binance-mcp-server --url https://agent.binance.com/mcp/agentic --oauth-client-id codex
codex mcp login binance-mcp-server

# Run the agent — free B.AI model drives it, calls real Binance market data
BAI_API_KEY=<key> ./agentos-run.sh \
  "Use binance-mcp-server futures_usds.symbolPriceTicker for BTCUSDT. Return only the price."
# → 77204.00   (real BTCUSDT futures price)
```

The `Binance Agentic MCP` is the official Binance infrastructure — not a bespoke REST clone. It
exposes market data, account, and trade scopes inside a dedicated Agent sub-account (no withdrawal).

## Repo layout

```
D:\BACKED\
├── src/
│   ├── canonical.ts     # byte-deterministic serialization (the trust root)
│   ├── provable.ts      # SHA256 + hash-chain + verifyRecord
│   ├── evidence.ts      # provenance layer
│   ├── datasource.ts    # multi-source corroboration (Binance + CoinGecko)
│   ├── reasoning.ts     # Azure gpt-4o-mini / deterministic
│   ├── pipeline.ts      # fund loop (evidence → decision → anchor → persist → verify)
│   ├── anchor.ts        # onchain anchor (BSC testnet, real tx)
│   ├── verifier.ts      # independent audit agent
│   ├── mcp-client.ts    # Binance Agentic MCP client (OAuth + JSON-RPC)
│   ├── trader.ts        # Binance testnet REST adapter (HMAC-signed)
│   └── store.ts         # SupabaseStore (backed schema) + LocalStore fallback
├── web/                 # Next.js dashboard (editorial dark), live /api/run
├── test/                # 25 tests
├── supabase/schema.sql  # backed schema (created, live; isolated from public.*)
├── agentos-run.sh       # Codex CLI runner (B.AI model + Binance MCP)
├── demo.sh              # end-to-end demo script
└── AGENTS.md            # the agent persona / loop
```

## Run it

```bash
# Install + build core
npm install && npx tsc -p tsconfig.json

# Unit tests (25)
npm test

# End-to-end demo: market data → decision → onchain anchor → verify
BAI_API_KEY=<key> ./demo.sh

# Live record via the dashboard's API
cd web && npm run dev   # then open /api/run → real decisionHash + anchorTx + verdict
```

## Config (`.env`, gitignored)

```
AZURE_OPENAI_API_KEY=...          # agent reasoning (gpt-4o-mini) — OR use B.AI via codex
AZURE_OPENAI_ENDPOINT=...
AZURE_OPENAI_CHAT_DEPLOYMENT_NAME=gpt-4o-mini
SUPABASE_URL=...                  # backed schema
SUPABASE_ANON_KEY=...
ANCHOR_PRIVATE_KEY=...            # BSC testnet wallet (onchain anchor)
BAI_API_KEY=...                   # free model for the Codex CLI agent
```

## Honest boundaries

- **Not a new financial primitive.** (We proved the mechanism is prediction-market-family; we don't
  claim otherwise.) The differentiator is the *autonomous agent + real Binance data + unforgeable
  onchain record + IP preservation* loop.
- **No alpha claim.** The demo demonstrates a provable, honest record — not "we're profitable."
- **No fabricated data.** Every price, hash, tx, and verdict is real or clearly labeled.

## Why it could win

- **Genuinely agent-native**: the whole loop runs autonomously inside Agent OS, built on Binance's
  own Agentic MCP — the exact thing Track A asks for.
- **Real execution**: real Binance market data, real BSC testnet anchor, real Supabase persistence.
- **A memorable hook**: "prove it without showing your strategy" — the platform's known blind spot,
  turned into a feature.
- **Provable honesty**: a Verifier agent independently re-audits → tamper/fabrication is caught, on
  screen, in front of a judge.

---

*Binance Agent OS Mini Hackathon · Track A · Sept 8, 2026*
