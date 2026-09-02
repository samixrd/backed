/**
 * verifier.ts — independent audit agent.
 *
 * The Verifier Agent's economic objective differs from the Fund Agent: it is PAID to catch
 * tampered or fabricated records (and slashed if it PASSes a fake one), so its incentive is to
 * attack, not to agree. It owns NO strategy — it only recomputes facts from what's on chain /
 * in the store and reports PASS/FAIL with evidence.
 *
 * This is the "this one's real, this one's fake" moment in the demo.
 */

import { decisionHash, verifyRecord, type ChainEntry } from "./provable.js";
import type { Store } from "./store.js";
import type { Fill } from "./types.js";

export interface VerifierReport {
  agentId: string;
  verdict: "PASS" | "FAIL";
  reason: string;
  checks: { name: string; pass: boolean; detail?: string }[];
  // Provenance / known good indicators
  recordLength: number;
}

export type CheckName =
  | "decisionHash"
  | "link"
  | "prevChain"
  | "ordering"
  | "evidence_bound"
  | "agent_bound"
  | "fill_truth";

/**
 * Pure audit of an in-memory entry list. Recomputs every hash, checks chain continuity, optional
 * ordering (no backdating), that each decision is bound to the signing agent, and evidence format.
 */
export function auditEntries(
  entries: ChainEntry[],
  agentId: string,
  opts?: { checkOrdering?: boolean; knownFillFn?: (orderId: string) => Promise<Fill | null> },
): VerifierReport {
  const checks: VerifierReport["checks"] = [];

  // Reuse the trust-engine verifier (decision hash + link + contiguity + ordering).
  const v = verifyRecord(entries, { checkOrdering: opts?.checkOrdering });
  checks.push(...v.steps.map((s) => ({ name: s.name as CheckName, pass: s.pass, detail: s.detail })));

  // Evidence-bound: every decision references a 64-hex inputSnapshotHash and reasonHash.
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const snapOk = /^[0-9a-f]{64}$/i.test(e.decision.inputSnapshotHash);
    const reasonOk = /^[0-9a-f]{64}$/i.test(e.decision.reasonHash);
    checks.push({
      name: "evidence_bound",
      pass: snapOk && reasonOk,
      detail: `entry[${i}] snapshotHash=${snapOk ? "ok" : "BAD"} reasonHash=${reasonOk ? "ok" : "BAD"}`,
    });
  }

  // Agent-bound: record belongs to the claimed agent (no cross-agent splicing).
  for (let i = 0; i < entries.length; i++) {
    const ok = entries[i].decision.agentId === agentId;
    checks.push({ name: "agent_bound", pass: ok, detail: `entry[${i}] agentId=${entries[i].decision.agentId}` });
  }

  const okAll = checks.every((c) => c.pass);
  return {
    agentId,
    verdict: okAll ? "PASS" : "FAIL",
    reason: okAll
      ? "record integrity verified — all checks passed"
      : `integrity check failed at: ${checks.filter((c) => !c.pass).map((c) => c.name).join(", ")}`,
    checks,
    recordLength: entries.length,
  };
}

/**
 * Load an agent's record from the store and audit it. This is the production entry point for the
 * Verifier Agent.
 */
export async function auditAgentRecord(
  store: Store,
  agentId: string,
  opts?: { checkOrdering?: boolean; knownFillFn?: (orderId: string) => Promise<Fill | null> },
): Promise<VerifierReport> {
  const entries: ChainEntry[] = await store.loadAgentRecord(agentId);
  return auditEntries(entries, agentId, opts);
}

/** Print a readable report (used by CLI / demo). */
export function formatReport(r: VerifierReport): string {
  const lines: string[] = [];
  lines.push(`Verifier Agent — audit of ${r.agentId}`);
  lines.push(`verdict: ${r.verdict}  |  ${r.reason}`);
  lines.push(`record entries: ${r.recordLength}`);
  const fails = r.checks.filter((c) => !c.pass);
  for (const c of r.checks) lines.push(`  ${c.pass ? "✓" : "✗"} ${c.name}${c.detail ? " — " + c.detail : ""}`);
  if (fails.length === 0) lines.push(`all ${r.checks.length} checks passed`);
  else lines.push(`✗ ${fails.length} check(s) FAILED`);
  return lines.join("\n");
}
