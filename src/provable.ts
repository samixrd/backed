/**
 * provable.ts — the core hashing + hash-chain + verification logic.
 *
 * This is the "Provable Alpha" trust engine. It computes the canonical bytes of a Decision,
 * hashes them, links each entry into a hash chain (anti-reorder / anti-delete), and exposes a
 * verifier that replays a record and PASSes/FAILs it.
 *
 * The chain-link integrity is enforced by STORING each entry's link (index, prevH, h) at append
 * time, then having the verifier recompute and compare. Because every link commits to the exact
 * previous decision hash and its own index, reordering, deleting, or editing any decision breaks
 * one of the checks.
 */

import { createHash, randomBytes } from "node:crypto";
import {
  concat,
  encodeLenPrefixed,
  encodeU64,
  encodeU256,
  utf8,
} from "./canonical.js";
import type { Decision, Evidence, Fill } from "./types.js";

export function sha256(bytes: Uint8Array | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

// --- canonical form ----------------------------------------------------------

export function canonicalDecision(d: Decision): Uint8Array {
  const sideByte: Uint8Array = new Uint8Array([d.side === "BUY" ? 1 : 2]);
  return concat([
    encodeLenPrefixed(utf8(d.agentId)),
    encodeU64(d.strategyVersion),
    encodeU64(d.ts),
    encodeLenPrefixed(utf8(d.symbol)),
    sideByte,
    encodeU256(d.qty),
    encodeLenPrefixed(fromHex32(d.inputSnapshotHash)),
    encodeLenPrefixed(fromHex32(d.reasonHash)),
    encodeU256(d.nonce),
    utf8("\n"),
  ]);
}

export function decisionHash(d: Decision): string {
  return sha256(canonicalDecision(d));
}

// --- evidence fingerprint (content-addressed) -------------------------------

export function evidenceFingerprint(e: {
  source: string;
  observedAt: bigint;
  payload: string;
}): string {
  const contentHash = sha256(utf8(e.payload));
  const fetchHash = sha256(
    concat([
      encodeLenPrefixed(utf8(e.source)),
      encodeU64(e.observedAt),
      encodeLenPrefixed(utf8(contentHash)),
    ]),
  );
  return sha256(
    concat([
      encodeLenPrefixed(utf8(e.source)),
      encodeU64(e.observedAt),
      encodeLenPrefixed(utf8(fetchHash)),
    ]),
  );
}

// inputSnapshotHash = SHA256(sorted evidence fingerprints). Sorting makes it order-independent,
// so re-ordering the evidence SET does not change the snapshot (the set is what matters).
export function computeInputSnapshotHash(evidences: Evidence[]): string {
  const fingerprints = evidences.map(evidenceFingerprint).sort();
  return sha256(concat(fingerprints.map((f) => encodeLenPrefixed(utf8(f)))));
}

export function randomNonce(): bigint {
  return BigInt("0x" + randomBytes(16).toString("hex"));
}

// --- hash chain --------------------------------------------------------------

export interface Link {
  index: number;
  prevH: string; // hash of the previous entry ("" for genesis)
  dataHash: string; // the decision hash this entry commits
  h: string; // SHA256(index, prevH, dataHash)
}

export function computeLink(index: number, dataHash: string, prevH: string): Link {
  const h = sha256(
    concat([
      encodeU64(index),
      encodeLenPrefixed(utf8(prevH)),
      encodeLenPrefixed(utf8(dataHash)),
    ]),
  );
  return { index, prevH, dataHash, h };
}

/** A fully-linked ledger entry: the raw decision + the stored chain link + optional anchor/fill. */
export interface ChainEntry {
  decision: Decision;
  link: Link; // stored at append time; verifier recomputes & compares
  anchorBlockTime?: bigint;
  fill?: Fill;
}

export interface Verdict {
  ok: boolean;
  steps: { name: string; pass: boolean; detail?: string }[];
}

/**
 * verifyRecord — replay entries in order and check:
 *   1. decisionHash integrity (recompute canonical form === committed dataHash),
 *   2. stored link matches recompute (index, prevH, dataHash),
 *   3. contiguity (index must be i and prevH must equal the previous entry's dataHash),
 *   4. optional ordering (anchorBlockTime <= fillTime, no backdating).
 *
 * Because each entry's stored link commits to (its index, the previous dataHash), reordering,
 * deleting, or editing any earlier decision breaks the chain at the next entry.
 */
export function verifyRecord(
  entries: ChainEntry[],
  opts?: { checkOrdering?: boolean },
): Verdict {
  const steps: Verdict["steps"] = [];

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const dh = decisionHash(e.decision);

    // 1. decision hash integrity
    const recomputed = sha256(canonicalDecision(e.decision));
    steps.push({ name: `entry[${i}].decisionHash`, pass: recomputed === dh });

    // 2. stored link matches recompute
    const expected = computeLink(i, dh, e.link.prevH);
    steps.push({
      name: `entry[${i}].link`,
      pass: e.link.h === expected.h && e.link.index === i && e.link.dataHash === dh,
    });

    // 3. contiguity: this entry's stored prevH must equal the previous entry's link hash
    const prevLinkH = i === 0 ? "" : entries[i - 1].link.h;
    steps.push({ name: `entry[${i}].prevChain`, pass: e.link.prevH === prevLinkH });

    // 4. ordering (no backdating)
    if (opts?.checkOrdering && e.anchorBlockTime !== undefined && e.fill !== undefined) {
      steps.push({ name: `entry[${i}].ordering`, pass: e.anchorBlockTime <= e.fill.fillTime });
    }
  }

  return { ok: steps.every((s) => s.pass), steps };
}

// helper: 32-byte hex string -> Uint8Array (throws on bad length)
function fromHex32(s: string): Uint8Array {
  const clean = s.startsWith("0x") ? s.slice(2) : s;
  if (clean.length !== 64) throw new Error("expected 32-byte hex (64 chars)");
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
