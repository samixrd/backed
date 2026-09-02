#!/usr/bin/env bash
# agentos-run.sh — run the BACKED agent inside Codex CLI against Binance Agentic MCP.
#
# Wires: B.AI free model (deepseek-v4-flash) + Binance MCP (whitelisted codex client_id).
# The -c overrides are needed because config.toml top-level model is not honored by this
# codex build. danger-full-access is required to auto-approve MCP tool calls (read-only
# market data in this loop; no funds move until --trade).
#
# Usage:
#   ./agentos-run.sh "Ask binance-mcp-server for BTCUSDT price"            # market data
#   ./agentos-run.sh --trade "Place a testnet demo order"                  # needs care
set -euo pipefail

BAI_API_KEY="${BAI_API_KEY:?set BAI_API_KEY (see .env)}"

exec codex exec \
  -c 'model_provider="bai"' \
  -c 'model="deepseek-v4-flash"' \
  -c 'web_search="disabled"' \
  -s danger-full-access \
  "$@"
