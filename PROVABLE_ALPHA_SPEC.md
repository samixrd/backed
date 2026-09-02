# PROVABLE ALPHA — Architecture & Data-Quality Specification

> **Product (one line):** An autonomous AI fund agent that researches, trades, and produces a
> cryptographically-verifiable, tamper-evident performance record — proving it really did what it
> says, **without revealing its strategy.**
>
> **Differentiator:** *Binance Agent OS can't see my reasoning — only my settled trades. So I can
> prove my record is real without leaking my edge.*
>
> **Status:** Engineering brief. Track A (Binance Agent OS Mini Hackathon). No code yet — this is
> the build-target spec.

---

## 0. Non-negotiable principles

1. **Every data point must be provenance-tracked.** A fact without a verifiable source is not a fact.
2. **Every decision must be committed before execution.** No "commit after the fact."
3. **The record must be self-inconsistent-detecting.** If any component is altered, the whole chain fails loudly.
4. **Determinism at the hash boundary.** Same inputs → same hash, always. No floating point, no nondeterminism, no wall-clock drift in the canonical form.
5. **IP stays private.** Reasoning hash is committed, reasoning content never leaves the agent.
6. **Honest claims only.** We prove *authentic / unmodified / real-executed*, NOT "provably smart."

---

## 1. Architecture (layered)

```
┌────────────────────────────────────────────────────────────────────┐
│  AGENT OS RUNTIME                                                   │
│  ┌───────────────────────────────────────────────────────┐         │
│  │  FUND AGENT  (autonomous loop)                         │         │
│  │   RESEARCH → DECIDE → COMMIT → EXECUTE → RECORD → LOOP │         │
│  └───────────────────────────────────────────────────────┘         │
│  ┌───────────────────────────────────────────────────────┐         │
│  │  VERIFIER AGENT  (independent audit)                   │         │
│  │   PULL RECORD → RECOMPUTE → COMPARE → PASS/FAIL        │         │
│  └───────────────────────────────────────────────────────┘         │
└────────────────────────────────────────────────────────────────────┘
        │                     │                       │
        ▼                     ▼                       ▼
 ┌──────────────┐   ┌────────────────┐   ┌────────────────────┐
 │ DATA MCP     │   │ TRADING MCP    │   │ ONCHAIN WORKFLOWS  │
 │ signals,     │   │ order + fill   │   │ commit-hash anchor │
 │ market data  │   │ (real)         │   │ + onchain action   │
 └──────────────┘   └────────────────┘   └────────────────────┘
        │                     │                       │
        └──────────┬──────────┴───────────┬───────────┘
                   ▼                      ▼
        ┌─────────────────────────────────────────┐
        │  EVIDENCE STORE    (offchain, tamper-    │
        │  evident crypstore / content-addressed)  │
        │  ┌────────────────────────────────────┐  │
        │  │  ONCHAIN ANCHOR REGISTRY (facts)   │  │
        │  │  + PER-AGENT IMMUTABLE FACTS LEDGER│  │
        │  └────────────────────────────────────┘  │
        └─────────────────────────────────────────┘
```

**Separation of concerns (what belongs where):**

| Concern | Component | On/off-chain |
|---|---|---|
| Market data ingestion | Data MCP | off |
| Strategy reasoning | Fund Agent (private) | off (never leaves) |
| Decision commitment | Onchain anchor | **on** |
| Trade execution | Trading MCP | real (Binance/testnet) |
| Whole-record integrity | hash-chain | on (root) / off (leaf data) |
| Provenance of evidence | Evidence store | off (content-addressed) |
| Verified facts | Facts ledger | **on** |
| Audit/verdict | Verifier Agent | off (computes from on-chain refs) |

---

## 2. THE PROVABLE ALPHA CORE — crypto-grade tamper evidence

### 2.1 Canonical Decision object (must be byte-reproducible)

```
Decision {
  agentId        : address           // who commits
  strategyVersion : u32              // version pin (so old decisions valid)
  ts             : u64               // block-aligned UNIX time
  symbol         : string            // e.g. BTCUSDT
  side           : enum{BUY,SELL}    // or LONG/SHORT if perp
  qty            : u256 fixed-point  // EXACT (no float)
  inputSnapshotHash : bytes32        // SHA256 of the exact data used
  reasonHash     : bytes32           // SHA256 of reasoning (NEVER revealed)
  nonce          : u256              // anti-replay
}
```

**Canonical serialization rule** — MUST be byte-deterministic:
- Strict field order as listed above.
- Length-prefixed strings (encode length, then bytes) — prevents collision (`"a"+"bc"` vs `"ab"+"c"`).
- Numbers encoded big-endian fixed width.
- `\n` separator between fields.
- NO keys, NO maps, NO arbitrary JSON order, NO float (all math fixed-point).

```
canonical(Decision) := agentId_len||agentId || version_be8 || ts_be8
                    || sym_len||sym || side_byte || qty_be32
                    || inputSnapshotHash || reasonHash || nonce_be32
                    || "\n"
h := SHA256(canonical(Decision))
```

### 2.2 Evidence provenance (data quality — the heart of "real")

Every input that feeds a decision must carry a **provenance record**:

```
Evidence {
  evidenceId     : bytes32           // SHA256(canonical(evidence))
  source         : url|sourceLabel   // e.g. "binance-futures-funding-rate"
  observedAt     : u64               // when the data was observed (NOT when written)
  payload        : bytes             // raw snapshot
  contentHash    : bytes32           // SHA256(payload)  ← the real integrity anchor
  fetchHash      : bytes32           // SHA256(observedAt||source||contentHash)
  oracleRef      : optional string   // if it came from an oracle/feed
}
inputSnapshotHash = SHA256(sorted([evidence.evidenceId for each evidence used]))
```

**Why this matters for data quality:**
- `inputSnapshotHash` binds the *decision* to the *exact data it saw* — you cannot swap the data and keep the same decision hash.
- `observedAt` (separate from write-time) prevents "I recorded the price after the move."
- `contentHash` proves the payload wasn't edited after fetch.

### 2.3 Hash-chain (anti-reorder / anti-delete)

```
h_0 := SHA256(canonical(Genesis))
h_n := SHA256(h_{n-1} || canonical(Decision_n))
```

- Verifier recomputes the WHOLE chain from genesis to the claimed head.
- Any inserted/deleted/reordered decision breaks a link → whole chain FAILS.
- The current head is also periodically (or per-N) anchored onchain so an attacker can't fork the chain head without breaking the anchor.
- **Chain-head anchor cadence:** for mainnet cost, batch `N` decisions → merkle root → 1 anchor tx. For demo, per-decision anchor shows the live tx.

### 2.4 Onchain anchor (timestamp + root proof)

```
AnchorTx { chainHead, merkleRoot, blockTime, txHash }
```
- `blockTime(anchor) < orderTime(fill)` → proves the decision existed BEFORE execution (backdate-killer).
- The root binds every leaf decision; the whole record is a single onchain fact.

### 2.5 The VERIFICATION CLAIM (be precise, always)

| Claim | Provable? | Method |
|---|---|---|
| Authentic / not fabricated | ✅ | decisions committed before execution, real Binance fills |
| Unmodified / not backdated | ✅ | hash-chain + onchain anchor + observedAt ordering |
| Real-executed | ✅ | orderId + fill from Binance truth |
| Deterministic & replayable | ✅ | canonical form → recompute matches |
| Strategy reasoning drove the trade | ❌ | not without revealing (that's the whole point) |

---

## 3. WORKFLOW / STATE MACHINE

```
IDLE
 └─▶ RESEARCH    (multi-source, provenance-tagged; dedupe stale)
      └─▶ DECIDE (private reasoning → Decision object)
           └─▶ COMMIT   (compute canonical, sign, anchor onchain)
                └─▶ EXECUTE (trading MCP, real fill)
                     └─▶ RECORD (append decision + evidence refs to chain)
                          └─▶ EVALUATE (mark-to-market P&L, update facts)
                               └─▶ LOOP
```

Per-decision telemetry that must be captured (these are the "data quality" wins):
- decision ts, commit ts, blockTime, order submit ts, fill ts.
- `Δ = fillTs − observedAt` (data-to-execution latency — a quality metric).
- expected fill (from snapshot) vs actual fill (slippage — a quality metric).

---

## 4. VERIFIER AGENT — the independent auditor

```
verify(agentId):
  head := registry.head(agentId)                 // onchain, anchored
  repl  := replay(agentId, head)                  // rebuild canonical decisions
  for each d in repl:
    recompute h' := SHA256(canonical(d))
    assert h' == d.h                              // integrity
    assert d.doesSignatureMatch(agentId)          // authenticity
    assert chainLink(d) == d.h                    // chain continuity
    assert blockTime(anchor(d)) < fillTime(d)     // ordering (no backdate)
    assert fill(d) matches Binance truth          // real execution
  assert merkleRoot == head.root                  // root binding
  verdict PASS | FAIL {failedStep}
```

**Verifier's economic role:** it's paid to be correct — if it PASSes a fabricated record it gets slashed; if it FAILs a fake one it earns. This gives it a *different objective* from the Fund Agent (not a different prompt).

---

## 5. DATA QUALITY FRAMEWORK

### 5.1 The 5 invariants (machine-checkable, this is where "strong data" lives)

| # | Invariant | Purpose |
|---|---|---|
| DQ1 | Every evidence has a `contentHash` and `observedAt` | No un-sourcable data |
| DQ2 | `inputSnapshotHash` binds decision to exact data | No data swap |
| DQ3 | `Δ = fillTime − observedAt` is bounded & logged | Measures data freshness/latency |
| DQ4 | `slippage = |avgFill − snapshotPrice| / snapshotPrice` logged | Measures execution quality |
| DQ5 | Record is append-only & head-anchored | No silent rewrite |

### 5.2 Quality metrics (derived, deterministic — show these, they're impressive)

- **Data freshness:** average `Δ` (lower = better)
- **Execution quality:** average slippage (lower = better)
- **Capital Efficiency** = realizedP&L / totalCapitalAtRisk
- **Downside Discipline** = maxLoss / realizedP&L (lower is better)
- **Wash-trade detection** = any self-trade / repeated same-quantity-fresh-latency pattern → flag
- **Reputation integrity score** = fraction of record that's been independently verified (should be ~1.0)

### 5.3 Anti-garbage safeguards
- Reject evidence with stale `observedAt` (older than freshness window).
- Dedupe by `contentHash`.
- Reject decisions referencing evidence from a future block (clock skew guard).
- Cap qty / reject absurd values.
- All math fixed-point, round-toward-zero on payout, dust → protocol.

---

## 6. ONCHAIN vs OFFCHAIN (trust boundary)

| Layer | Contents | Verifiability |
|---|---|---|
| **Onchain** | market id, agent, capital, settlement, resolution, immutable facts ledger, anchor roots | Any judge can re-verify |
| **Offchain** | agent reasoning, evidence indexing, discovery, UI, analytics, orchestration | Provenance-verified, content-addressed |
| **Never stored anywhere** | raw reasoning text (only `reasonHash`) | — by design |

Honest trust model: this is **verifiable + semi-trusted** (relies on Binance testnet feed as source-of-truth for fills; onchain anchor is the integrity root). NOT decentralized, NOT a trustless oracle. State this clearly in the demo.

---

## 7. DEMO (90 seconds, act by act)

1. **Autonomy** — Fund Agent wakes alone, researches via Data MCP, prints a Decision.
2. **Commit** — hash goes onchain (live tx visible). *"Nobody clicked."*
3. **Real trade** — Trading MCP executes; real order + fill + hash.
4. **Verification** — Verifier audits a *tampered* record → FAIL; audits *this* one → PASS.
5. **The moment** — Two cards. *"I have a great track record."* vs *"Prove it without showing your strategy."* — Verifier confirms onchain.

**One-liner:** *"I can prove my AI really did what it says — without showing how it does it."*

---

## 8. Build order (single-day, with AI assistance)

1. Canonical `Decision` schema + SHA256 + hash-chain (invariant tests). **Foundation**
2. Evidence provenance (`inputSnapshotHash` + `observedAt`). **Data quality core**
3. Onchain anchor (commit tx). **Integrity root**
4. Trading MCP execution + real fill capture.
5. Verifier Agent (recompute, compare, PASS/FAIL).
6. UI: live activity feed + PROOF tab + quality-metric panel.
7. 90s demo script + judge-attack prep.

## 9. CUT (scope discipline)
- Prediction market, pooling, portfolio optimizer, premium, secondary markets, ZK selective disclosure.
- Any feature that doesn't demonstrably raise the *trust* in the record.

## 10. Honest judge-attack prep

| Attack | Answer |
|---|---|
| "Just a hash before a tx" | True — but Agent OS can't see the reasoning, so IP stays private. That's unique to this platform. |
| "Provable alpha ≠ provable smart" | Correct. We prove *authentic / unmodified / real*. That's the honest claim. |
| "Why agents?" | The loop runs without ego, 24/7, mass positions, autonomous audit. |
| "Where's the money?" | Own capital; strict conservation. |
| "Data could be wrong" | Provenance-tagged, `observedAt`-bounded, content-hashed, slippage-measured. DQ1–DQ5. |
