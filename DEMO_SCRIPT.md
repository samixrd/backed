# BACKED — 90-Second Demo Script

> For the Binance Agent OS Mini Hackathon (Track A). A judge should feel the hook in the first 10s
> and see the verification on screen. Read the **bold** lines aloud; the rest is camera action.

## ACT 1 — The hook (0:00–0:12)
**"Every AI claims a great track record. You can't trust any of it — it can be faked, backdated, or
rewritten. And publishing the strategy leaks the edge."**

*Camera:* the dashboard header. Text dissolves to the two-column "confession" card:
- LEFT: **"I have a great track record."** (a generic agent)
- RIGHT: **"Prove it without showing your strategy."**

## ACT 2 — The agent is real + autonomous (0:12–0:35)
**"This agent runs on Binance Agent OS and actually trades. It pulled this live from Binance's own
MCP — no fake numbers."**

*Camera:* terminal. Run:
```bash
./agentos-run.sh "Use binance-mcp-server futures_usds.symbolPriceTicker for BTCUSDT. Return only the price."
```
> Terminal prints: `futures_usds.symbolPriceTicker (completed)` → **77204.00**

**"77204.00 — real BTCUSDT futures price, from Binance's Agentic MCP server."**

## ACT 3 — The provable record (0:35–1:05)
**"Now watch what makes this different. The agent reasoned a decision — but the reasoning is never
shown. Only a hash of it. Then the decision is locked onchain."**

*Camera:* README/verify output. Point to each:
- `decisionHash` → SHA256 of the decision
- `reasonHash` → SHA256 of the reasoning **— never stored**
- `anchorTx` → **a real BSC testnet transaction** — the timestamp proof, so it **can't be backdated**
- `Stored` → persisted to Supabase

**"Proof happens before the action. The hash is on the chain before the trade settles."**

## ACT 4 — The verifier catches a lie (1:05–1:35)
**"But here's the part that matters. Any record can claim to be genuine. So we have a Verifier agent
that re-audits it — recomputes every hash, checks the chain, checks the ordering."**

*Camera:* run the Verifier on the **genuine** record → **PASS**.
Then run it on a **tampered** record (a copied one with one field changed) → **FAIL**.

> GENUINE → **verdict: PASS** · TAMPERED → **verdict: FAIL — caught**

**"One honest, one tampered. The verifier tells them apart instantly — because the hash chain is
unforgeable."**

## ACT 5 — The line (1:35–1:50, the closer)
**"So now an agent can prove it's real without leaking its edge, and a Verifier can catch a lie in
seconds. Anyone can claim a track record — now anyone can verify it, without seeing the strategy.
**That's Backed.**"**

*Camera:* hold on the dashboard — the live record showing decisionHash, anchorTx, and **verdict:
PASS**.

---

## Submission checklist
- [ ] GitHub repo link (this project)
- [ ] Demo video (this 90s script)
- [ ] Follow @Binance + repost the announcement
- [ ] Reply/quote with your submission (Track A: video + GitHub)
- [ ] Complete the Binance survey
