/**
 * anchor.test.ts — onchain anchor adapter tests (deterministic intent path; no live broadcast).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { anchorDecisionHash, anchorIntent, canonicalAnchorPayload } from "../src/anchor.js";
import { sha256 } from "../src/provable.js";

test("anchorIntent is deterministic and clearly non-anchored", async () => {
  const a = anchorIntent("c0e3112ab40a3c5d6d09f927af3090e15d9e512eb04f104917569acb4e5f4c77");
  const b = anchorIntent("c0e3112ab40a3c5d6d09f927af3090e15d9e512eb04f104917569acb4e5f4c77");
  assert.equal(a.txHash, b.txHash, "same input => same intent hash");
  assert.equal(a.anchored, false, "intent is not an onchain tx");
  assert.ok(/^[0-9a-f]{64}$/i.test(a.txHash) || a.txHash.startsWith("0x"), "has a deterministic 32-byte hash");
});

test("anchorIntent differs for different values", () => {
  const a = anchorIntent("c0e3112a".repeat(8));
  const b = anchorIntent("f00d".repeat(16));
  assert.notEqual(a.txHash, b.txHash);
});

test("canonicalAnchorPayload is domain-separated (can't collide with another blob)", () => {
  const p1 = canonicalAnchorPayload("a".repeat(64), "bsc-testnet");
  const p2 = canonicalAnchorPayload("a".repeat(64), "bsc-mainnet");
  assert.notEqual(sha256(p1), sha256(p2), "chain must be part of the domain");
  assert.notEqual(sha256(p1), sha256(canonicalAnchorPayload("b".repeat(64), "bsc-testnet")), "value must be part of domain");
});

test("anchorDecisionHash returns intent when no key (never fabricates a real tx)", async () => {
  delete process.env.ANCHOR_PRIVATE_KEY;
  delete process.env.ANCHOR_TO;
  const r = await anchorDecisionHash("c0e3112a".repeat(8));
  assert.equal(r.anchored, false);
  assert.ok(r.note?.includes("DRY-RUN") || r.note?.includes("dry-run") || r.txHash.length === 64);
});
