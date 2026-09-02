/**
 * verify.js — the demo "wow" runner.
 *
 *   1. Run the fund pipeline (real data) → produces a genuine record.
 *   2. Show the Verifier audit on it → PASS.
 *   3. Mutate a copy (tamper) → show the Verifier catches it → FAIL.
 *
 * This is the "this one's real, this one's fake" moment. The mutation is explicitly labeled a
 * tamper-demo — we never hide it. All data is real market data; the strategy makes no alpha claim.
 */

import { runFundPipeline } from "./pipeline.js";
import { pickStoreFromEnv } from "./store.js";
import { auditAgentRecord, formatReport } from "./verifier.js";
import type { ChainEntry } from "./provable.js";

async function main() {
  const agentId = process.env.AGENT_ID ?? "0xBACKED-Alpha";
  const store = pickStoreFromEnv();
  const write = (s: string) => process.stdout.write(s + "\n");

  write("=== PROVABLE ALPHA — VERIFIER DEMO ===\n");

  // 1. Genuine record from real data.
  const res = await runFundPipeline({
    agentId,
    side: "BUY",
    qty: 10_000_000_000n,
    store,
    openaiApiKey: process.env.OPENAI_API_KEY,
    gptModel: process.env.GPT_MODEL ?? "gpt-4o-mini",
  });
  if (!res.ok) {
    write(`✗ fund pipeline failed at: ${res.step}`);
    process.exit(1);
  }
  write("── [1] Genuine record (real data) ──");
  write(`    evidenceSetHash: ${res.evidenceSetHash}`);
  write(`    decisionHash:    ${res.decisionHash}`);
  write(`    reasonHash:      ${res.decision?.reasonHash}  (IP preserved)\n`);

  // 2. Verify the genuine record → likely PASS.
  const genuine = await auditAgentRecord(store, agentId, { checkOrdering: true });
  write("── [2] Verifier audit on genuine record ──");
  write(formatReport(genuine));
  write("");

  // 3. Tamper-demo: copy the record but mutate qty on a middle entry while KEEPING the original
  //    (onchain-anchored) link. The verifier recomputes the decision hash, sees it no longer
  //    matches the stored link's dataHash, and FAILs. This is exactly how the chain catches
  //    tampering: the stored link is the anchored truth; you can't change a decision without
  //    re-anchoring onchain, which an attacker can't do.
  const rec = await store.loadAgentRecord(agentId);
  const tampered: ChainEntry[] = rec.map((e, i) => {
    if (i === Math.floor(rec.length / 2)) {
      // Mutate qty but KEEP the original link (the onchain-anchored value).
      return { decision: { ...e.decision, qty: e.decision.qty + 1n }, link: e.link, anchorBlockTime: e.anchorBlockTime, fill: e.fill };
    }
    return e;
  });

  // Write the tampered copy to a FRESH temp store under a separate agent so we never corrupt
  // the real record. agentId stays the original so agent_bound passes and the failure is purely
  // the chain link (which is the honest, demonstrable cause).
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { LocalStore } = await import("./store.js");
  const fakeStore = new LocalStore(mkdtempSync(join(tmpdir(), "verified-tamper-")));
  for (const e of tampered) await fakeStore.saveEntry(e);

  const fake = await auditAgentRecord(fakeStore, agentId, { checkOrdering: true });
  write("── [3] Tamper-demo: qty mutated mid-record, original anchor kept, re-audited ──");
  write(formatReport(fake));
  write("");
  write("KEY: the tampered record FAILS because the stored chain link no longer matches the");
  write("mutated decision hash. A verifier (or any judge) can recompute and catch it — no human needed.");

  process.exit(genuine.verdict === "PASS" && fake.verdict === "FAIL" ? 0 : 1);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
