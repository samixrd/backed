# BACKED — 90-Second Hackathon Demo Script

> Designed for the **Binance Agent OS Hackathon**. Direct, impactful, showing the live terminal, institutional charts, Binance Agent OS integration, and onchain verification in 90 seconds.

---

## ACT 1 — The Hook & Problem (0:00–0:15)
**"Every trading AI claims insane accuracy, but retail traders are drowned in complex metrics, and there is zero proof of a real track record without backdating or leaking strategy IP. We solve both."**

*Camera:* The BACKED Terminal UI.
- Highlight the **Binance Agent OS Native** hero badge.
- Highlight the live ticker: **BTCUSDT Live Price, OI, and Top Trader Long/Short Bias**.

---

## ACT 2 — Live Market Intel & AI Copilot (0:15–0:40)
**"Running natively inside Binance Agent OS, BACKED ingests real-time Binance Futures Open Interest, Top Trader Long/Short sentiment, and aggressive Taker volume."**

*Camera:* Point to the three institutional SVG charts:
1. **Top Trader Sentiment Donut Chart** (e.g. 55.6% Long).
2. **Taker Flow Pressure Bar Chart** (Buy vs Sell imbalance).
3. **Funding & Leverage Overheat Gauge**.

**"Users don't need to stare at complex charts. They can simply ask the Binance Agent OS Copilot:"**
*Action:* Click query chip or type *"What are top traders doing on BTC right now?"*
*Copilot outputs:* Concise, institutional briefing based on live Binance derivatives.

---

## ACT 3 — Provable Alpha Onchain Commit (0:40–1:05)
**"When the agent makes a trade decision, it preserves proprietary IP: reasoning is hashed into `reasonHash` and instantly discarded. Then the decision hash is anchored directly onchain to the BNB Smart Chain (BSC Testnet)."**

*Camera:* Run terminal:
```bash
node dist/src/pipeline.js
```
*Output shown:*
- `Decision Hash:` e.g. `7e4fcedce...`
- `BSC Testnet Tx:` e.g. `0xc72698be7d6e261e384e74f69cc1dbdd5fe939c7884dd36ae52d9c6a60b670da`
- **"The timestamp is locked onchain before execution. It can never be backdated or modified."**

---

## ACT 4 — Independent Verifier Catches Tampering (1:05–1:25)
**"Any AI can claim a track record. But BACKED features an independent Verifier Agent that re-audits every hash, chain link, and timestamp."**

*Camera:* Run Verifier:
- Genuine record: **`AUDIT VERDICT: PASS`**
- Show a tampered record: **`AUDIT VERDICT: FAIL` (Caught instantly!)**

---

## ACT 5 — The Closer (1:25–1:35)
**"Real Binance market intel, everyday user simplicity, and cryptographically provable alpha on the BNB Smart Chain. That is BACKED on Binance Agent OS."**
