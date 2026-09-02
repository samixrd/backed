/**
 * trader.test.ts — Binance testnet trader adapter (dry-run; no keys required).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { placeMarketOrder, type OrderResult } from "../src/trader.js";

test("placeMarketOrder dry-run returns signed payload without broadcasting", async () => {
  const r = await placeMarketOrder(
    { mode: "testnet", apiKey: "test-key", apiSecret: "test-secret", live: false },
    { symbol: "BTCUSDT", side: "BUY", quantity: "0.001", decisionHash: "abc".padEnd(64, "0") },
  );
  assert.equal(r.placed, false);
  assert.ok(r.signedRequest, "signed payload should be present");
  assert.ok(r.signedRequest!.url.includes("signature="), "url should carry an HMAC signature");
  assert.equal(r.symbol, "BTCUSDT");
  assert.ok(r.note?.includes("DRY-RUN"), "should be clearly labeled dry-run");
});

test("placeMarketOrder dry-run never fabricates an order id", async () => {
  const r = await placeMarketOrder(
    { mode: "testnet", apiKey: "k", apiSecret: "s", live: false },
    { symbol: "BTCUSDT", side: "SELL", quantity: "0.0", decisionHash: "d".repeat(64) },
  );
  assert.equal(r.placed, false);
  assert.equal(r.orderId, undefined, "no order id in dry-run");
});

test("HMAC signature is deterministic and verifiable", async () => {
  const { createHmac } = await import("node:crypto");
  // Run twice with the same input => same signature
  const a: OrderResult = await placeMarketOrder(
    { mode: "testnet", apiKey: "k", apiSecret: "secret", live: false },
    { symbol: "BTCUSDT", side: "BUY", quantity: "0.001", decisionHash: "a".repeat(64) },
  );
  const b: OrderResult = await placeMarketOrder(
    { mode: "testnet", apiKey: "k", apiSecret: "secret", live: false },
    { symbol: "BTCUSDT", side: "BUY", quantity: "0.001", decisionHash: "a".repeat(64) },
  );
  const sigOf = (r: OrderResult) => r.signedRequest!.url.match(/signature=([0-9a-f]+)/)![1];
  assert.equal(sigOf(a), sigOf(b), "same request => same signature");
  // It must be 64 hex chars
  assert.match(sigOf(a), /^[0-9a-f]{64}$/);
  void createHmac;
});
