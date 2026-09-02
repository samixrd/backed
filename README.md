# PROVABLE ALPHA

> **An autonomous AI fund agent that researches, trades, and produces a cryptographically-verifiable,
> tamper-evident performance record — proving it really did what it says, without revealing its strategy.**

**Track A · Binance Agent OS Mini Hackathon**
**Differentiator:** Binance Agent OS can't see my reasoning — only my settled trades. So I can prove my record
is *authentic / unmodified / real-executed* without leaking my edge.

---

## Table of Contents

1. [Why this exists](#1-why-this-exists)
2. [What we prove — and what we don't](#2-what-we-prove--and-what-we-dont)
3. [Architecture](#3-architecture)
4. [How the agent loop works](#4-how-the-agent-loop-works)
5. [The Provable Alpha core](#5-the-provable-alpha-core)
6. [Data-quality framework](#6-data-quality-framework)
7. [Tech stack](#7-tech-stack)
8. [Build order (step by step)](#8-build-order-step-by-step)
9. [Setup / run locally](#9-setup--run-locally)
10. [The demo](#10-the-demo)
11. [Honest trust model](#11-honest-trust-model)
12. [Cut list](#12-cut-list)
13. [Files](#13-files)

---

## 1. Why this exists

AI agents make confident claims with **zero cost of being wrong**, and you can't verify any of them —
track records are self-reported and easily faked (curated backtests, cherry-picked wins).

Meanwhile, **Binance Agent OS can't see an agent's reasoning — only its settled trades.** That architectural
fact is the key. It means an agent can build a **provably-authentic execution record** without leaking its
strategy (its edge, its IP).

**The product:** a fund agent whose performance record is:
- **Provably real** (decisions committed before execution, real fills)
- **Provably unmodified** (hash-chain + onchain anchor, no backdating)
- **Provably IP-preserving** (reasoning is hashed, never revealed)
- **Auditable by anyone** (an independent Verifier agent)

---

## 2. What we prove — and what we don't

| Claim | Provable? | How |
|---|---|---|
| Authentic / not fabricated | ✅ | decision committed before execution; real Binance fills |
| Unmodified / not backdated | ✅ | hash-chain + onchain anchor + `observedAt` ordering |
| Real-executed | ✅ | orderId + fill verified against Binance truth |
| Deterministic & replayable | ✅ | canonical form → recompute matches |
| Strategy reasoning drove the trade | ❌ | not without revealing — that's the whole point |

We are **honest**: this proves *provable authenticity of the record*, **not** "provably smart."

---

## 3. Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│  AGENT OS RUNTIME                                                   │
│  ┌───────────────────────────────────────────────────────┐         │
│  │  FUND AGENT  (autonomous loop)                         │         │
│  │   RESEARCH → DECIDE → COMMIT → EXECUTE → RECORD → LOOP │         │
│  └───────────────────────────────────────────────────────┘         │
│  ┌───────────────────────────────────────────────────────┐         │
│  │  VERIFIER AGENT  (independent audit)                   │         │
│  │   PULL → RECOMPUTE → COMPARE → PASS/FAIL               │         │
│  └───────────────────────────────────────────────────────┘         │
└────────────────────────────────────────────────────────────────────┘
        │                     │                        │
        ▼                     ▼                        ▼
 ┌──────────────┐   ┌────────────────┐   ┌────────────────────┐
 │ DATA MCP     │   │ TRADING MCP    │   │ ONCHAIN WORKFLOWS  │
 │ signals,     │   │ order + fill   │   │ commit-hash anchor │
 │ market data  │   │ (real)         │   │ + onchain action   │
 └──────────────┘   └────────────────┘   └────────────────────┘
```

**Agents (different economic objectives, not different prompts):**
- **Fund Agent** — maximizes risk-adjusted return while keeping strategy private.
- **Verifier Agent** — earns by *catching* fabricated records; slashed if it PASSes a fake. Different objective.

---

## 4. How the agent loop works

```
IDLE
 └─▶ RESEARCH    (multi-source, provenance-tagged, dedupe stale)
      └─▶ DECIDE (private reasoning → Decision object)
           └─▶ COMMIT   (compute canonical, sign, anchor onchain)
                └─▶ EXECUTE (trading MCP, real fill)
                     └─▶ RECORD (append decision + evidence refs to chain)
                          └─▶ EVALUATE (mark-to-market P&L, update facts)
                               └─▶ LOOP
```

Per-decision telemetry (data-quality wins):
- decision ts, commit ts, blockTime, order submit ts, fill ts.
- `Δ = fillTime − observedAt` (data-to-exec latency — a quality metric).
- `slippage = |avgFill − snapshotPrice| / snapshotPrice`.

---

## 5. The Provable Alpha core

### Canonical Decision (byte-reproducible — must be deterministic)

```
Decision {
  agentId, strategyVersion, ts (block-aligned), symbol,
  side (BUY|SELL), qty (fixed-point, exact),
  inputSnapshotHash (SHA256 of exact data used),
  reasonHash (SHA256 of reasoning — NEVER revealed),
  nonce (anti-replay)
}
```

Serialization **must** be: strict field order, length-prefixed strings, big-endian fixed-width numbers,
`\n` separators, no floats, no maps (avoids `["a","bc"]` vs `["ab","c"]` collisions).

```
h := SHA256(canonical(Decision))
```

### Hash-chain (anti-reorder / anti-delete)

```
h_0 := SHA256(canonical(Genesis))
h_n := SHA256(h_{n-1} || canonical(Decision_n))
```

- Verifier recomputes whole chain.
- Insert / delete / reorder → breaks a link → whole chain FAILS.
- Chain head anchored onchain (batch N → merkle root for cost; per-trade shown in demo).

### Onchain anchor (timestamp + root proof)

```
AnchorTx { chainHead, merkleRoot, blockTime, txHash }
```

- `blockTime(anchor) < orderTime(fill)` → backdate-killer.
- Root binds every decision; whole record = one onchain fact.

### Evidence provenance (data quality — the heart of "real")

```
Evidence {
  evidenceId  = SHA256(canonical(evidence)),
  source, observedAt (when data observed, NOT written),
  payload, contentHash = SHA256(payload),
  fetchHash = SHA256(observedAt||source||contentHash),
  oracleRef (optional)
}
inputSnapshotHash = SHA256(sorted([evidence.evidenceId ...]))
```

---

## 6. Data-quality framework

### Five invariants (machine-checkable)

| # | Invariant | Purpose |
|---|---|---|
| DQ1 | every evidence has `contentHash` + `observedAt` | No unsourcable data |
| DQ2 | `inputSnapshotHash` binds decision to exact data | No data swap |
| DQ3 | `Δ = fillTime − observedAt` bounded & logged | Data freshness |
| DQ4 | `slippage` logged | Execution quality |
| DQ5 | record append-only & head-anchored | No silent rewrite |

### Derived quality metrics (deterministic)

- **Data freshness:** average `Δ` (lower better)
- **Execution quality:** average slippage (lower better)
- **Capital efficiency:** `realizedP&L / totalCapitalAtRisk`
- **Downside discipline:** `maxLoss / realizedP&L` (lower better)
- **Wash-trade detection:** repeated same-qty fresh-latency → flag
- **Reputation integrity:** fraction independently verified (≈1.0)

### Anti-garbage safeguards
- reject stale `observedAt`, dedupe by `contentHash`,
- reject future-block evidence (clock-skew guard),
- cap qty, fixed-point math, round-toward-zero, dust → protocol.

---

## 7. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Agent runtime | Binance Agent OS | autonomous loop + MCP tools |
| Market data | Data MCP | signals, funding rate, price/EMA, volume |
| Trading | Trading MCP | real order + fill (testnet) |
| Onchain | Onchain Workflows MCP | commit-hash anchor + onchain action (BSC/Binance testnet) |
| Hashing | SHA256 | canonical serialization |
| Storage | content-addressed evidence store | offchain, tamper-evident |
| Logic | TypeScript/Node or Python | — |

> 🔲 **REQUIRES VERIFICATION:** exact Agent OS MCP tool names for Data / Trading / Onchain workflows, and
> their response schemas. Confirm which onchain chain/testnet the anchor tx can hit + gas cost. Add once known.

---

## 8. Build order (step by step)

1. **Foundation** — canonical `Decision` + SHA256 + hash-chain + DQ invariants (with tests). *The trust engine.*
2. **Evidence provenance** — `inputSnapshotHash` + `observedAt` + content-hash store.
3. **Onchain anchor** — commit tx of chain head / merkle root.
4. **Trading MCP** — execute + capture real fill.
5. **Verifier Agent** — recompute, compare, PASS/FAIL.
6. **UI** — live activity feed + PROOF tab + quality-metric panel.
7. **Demo** — 90s act-by-act + judge-attack prep.

---

## 9. Setup / run locally

> 🔲 **REQUIRES VERIFICATION** — exact Agent OS CLI / SDK init, MCP registration, and testnet funding steps.
> Fill in once confirmed. Placeholder structure:

```bash
# 1. Clone / init project
cd D:\BACKED
# 2. Install deps (Node/TS assumed)
npm install
# 3. Configure environment
#    AVALON_AGENT_ID, MCP_DATA_URL, MCP_TRADING_URL, MCP_ONCHAIN_URL,
#    SIGNER_PRIVATE_KEY (agent key), TESTNET_RPC
# 4. Build foundation module (canonical + hash-chain)
npm run build
# 5. Run the fund agent loop (dry-run vs live)
npm run fund:dryrun   # no real orders, just decision+commit
npm run fund:live     # real testnet trades
# 6. Run verifier
npm run verify -- --agent <agentId>
```

Each step prints the canonical hash + anchor + fill so you can eyeball integrity.

---

## 10. The demo

1. **Autonomy** — Fund Agent wakes alone, researches via Data MCP, prints a Decision.
2. **Commit** — hash goes onchain (live tx visible). *"Nobody clicked."*
3. **Real trade** — Trading MCP executes; real order + fill + hash.
4. **Verification** — Verifier audits a *tampered* record → FAIL; audits *this* one → PASS.
5. **The moment** — *"I have a great track record."* vs *"Prove it without showing your strategy."* —
   Verifier confirms onchain.

**One-liner:** *"I can prove my AI really did what it says — without showing how it does it."*

---

## 11. Honest trust model

- **Verifiable (judge can check):** decisions, anchors, fills, hash-chain, facts ledger, DQ metrics.
- **Semi-trusted:** Binance testnet feed as source-of-truth for fills (labeled); onchain anchor = integrity root.
- **NOT decentralized, NOT a trustless oracle.** State this clearly.
- **Never stored:** raw reasoning (only `reasonHash`).

---

## 12. Cut list

Prediction market · pooling · portfolio optimizer · premium · secondary markets · ZK selective disclosure.
Anything that doesn't raise trust in the record gets cut.

---

## 13. Files

- `PROVABLE_ALPHA_SPEC.md` — full architecture + data-quality spec (build target).
- `README.md` — this overview.
