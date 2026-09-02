#!/usr/bin/env bash
# demo.sh — run the BACKED Provable Alpha demo end-to-end.
#
#   1. Agent (B.AI deepseek via Codex CLI) asks Binance MCP for real market data.
#   2. The BACKED core builds the decision, anchors the hash onchain (BSC testnet), persists it,
#      and runs the Verifier audit.
#
#   Usage: ./demo.sh            # market data + provable record + verify (no order)
#          ./demo.sh --live     # also allow a confirmed order (needs funded testnet account)
set -euo pipefail

export BAI_API_KEY="${BAI_API_KEY:?set BAI_API_KEY (see .env)}"
cd "$(dirname "$0")"

echo "═══ BACKED — Provable Alpha ═══"

# 1. Real market data via Binance Agentic MCP (the agent's "research" step)
echo ""
echo "[1] AGENT (Codex CLI + B.AI) → Binance MCP market data"
PRICE=$(timeout 120 ./agentos-run.sh \
  "Use binance-mcp-server futures_usds.symbolPriceTicker for BTCUSDT. Return ONLY the numeric price, nothing else." 2>/dev/null | tail -1 | grep -oE '[0-9]+(\.[0-9]+)?' | head -1)
echo "    BTCUSDT = ${PRICE:-UNKNOWN}"

# 2. BACKED core: decision → onchain anchor → Persist → Verify (deterministic, no model needed)
echo ""
echo "[2] BACKED core → provable record + onchain anchor + verify"
node dist/src/verify.js 2>&1 | tail -20

echo ""
echo "═══ Done. See verify.js output above for decisionHash + anchorTx + verdict. ═══"
