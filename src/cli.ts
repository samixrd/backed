/**
 * cli.ts — runnable entry point for the Fund Agent.
 *
 *   node dist/cli.js --dry-run     # gather evidence, reason, decide, persist, verify — no order
 *   node dist/cli.js --live        # same, and prints the exact order JSON a Trading MCP would send
 *
 * Demo data vs real data: this CLI uses REAL market data (Binance + CoinGecko public APIs).
 * It does NOT place any real order. It stops at the decision record. Trade execution + the
 * onchain anchor are separate (see DATA_SOURCES.md / PROVABLE_ALPHA_SPEC.md).
 */

import { runFundPipeline, type PipelineConfig } from "./pipeline.js";
import { pickStoreFromEnv } from "./store.js";

function parseArgs(): { live: boolean; side: "BUY" | "SELL"; qty: string } {
  const args = process.argv.slice(2);
  const live = args.includes("--live");
  const sideIdx = args.indexOf("--side");
  const side = sideIdx >= 0 && args[sideIdx + 1] === "SELL" ? "SELL" : "BUY";
  const qtyIdx = args.indexOf("--qty");
  const qty = qtyIdx >= 0 ? args[qtyIdx + 1] : "10000000000"; // 100 BTC (1e8) — demo quantity
  return { live, side, qty };
}

async function main() {
  const { live, side, qty } = parseArgs();
  const cfg: PipelineConfig = {
    agentId: process.env.AGENT_ID ?? "0xBACKED-Alpha",
    strategyVersion: 1,
    side,
    qty: BigInt(qty),
    openaiApiKey: process.env.OPENAI_API_KEY,
    gptModel: process.env.GPT_MODEL ?? "gpt-4o-mini",
    store: pickStoreFromEnv(),
  };

  const write = (s: string) => process.stdout.write(s + "\n");
  write(`BACKED Fund Agent — ${cfg.agentId}`);
  write(`mode: ${live ? "LIVE (prints order)" : "DRY-RUN (no order)"} | side: ${side} | qty: ${qty}`);
  write("=".repeat(64));

  const result = await runFundPipeline(cfg);
  if (!result.ok) {
    write(`\n✗ FAILED at step: ${result.step}`);
    process.exit(1);
  }

  write(`\n[1] EVIDENCE (real, multi-source):`);
  write(`    sources: ${result.evidenceCount}`);
  write(`    evidenceSetHash: ${result.evidenceSetHash}`);
  write(`[2] REASONING (mode: ${result.reasoningMode}):`);
  write(`    ${result.reasoningLabel}`);
  write(`[3] DECISION:`);
  write(`    agentId: ${cfg.agentId}`);
  write(`    symbol/ side/qty: BTCUSDT ${side} ${qty}`);
  write(`    reasonHash: ${result.decision?.reasonHash}  (reasoning NOT stored — IP preserved)`);
  write(`    nonce: ${String(result.decision?.nonce)}`);
  write(`[4] PROVABLE RECORD:`);
  write(`    decisionHash: ${result.decisionHash}`);
  write(`    linkH: ${result.link?.h}`);
  write(`    stored: ${result.stored}`);
  write(`[5] VERIFY (after round-trip): ${result.verification?.ok ? "PASS ✓" : "FAIL ✗"}`);

  write(`\nConservation: none required for dry-run (no external funds moved).`);
  write(`The record is tamper-evident: changing any decision breaks the chain. See tests.`);

  if (live) {
    write(`\n[ORDER] (NOT SENT — demo only)`);
    write(JSON.stringify({
      symbol: "BTCUSDT",
      side,
      type: "MARKET",
      quantity: qty,
      decisionHash: result.decisionHash,
      reasonHash: result.decision?.reasonHash,
    }, null, 2));
  }

  write(`\nNote: this is a DEMO loop. The strategy makes no claim of alpha and is not financial advice.`);
  process.exit(0);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
