/**
 * anchor.ts — onchain anchor for the Provable Alpha record.
 *
 * "Provable" is only as strong as its integrity root. A decision hash in a local DB can still be
 * rewritten by its operator; anchoring the hash in an independent, timestamped chain ledger is what
 * makes the record externally verifiable. This module commits a decision hash to BNB Smart Chain
 * (testnet) and returns the real tx hash + block time.
 *
 * Uses ethers (v6) — no raw-RPC serialization to hand-roll. Wallet key comes from env
 * (ANCHOR_PRIVATE_KEY). We sign a 0-value transfer with `data: <anchor payload>`; the blob is
 * immutable on-chain and its tx is the timestamp proof. We NEVER fabricate a tx hash — if no key
 * or no `to` is set, we return a deterministic ANCHOR-INTENT (clearly labeled, not a real chain tx).
 */

import { createHash } from "node:crypto";
import { ethers } from "ethers";
import { encodeLenPrefixed, utf8, concat } from "./canonical.js";

export interface AnchorReceipt {
  anchored: boolean;
  anchorValue: string;
  txHash: string;
  blockTime: bigint;
  blockNumber?: bigint;
  chain: string;
  note?: string;
}

export const RPC = {
  "bsc-testnet": "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
  "bsc-mainnet": "https://bsc-dataseed.binance.org",
} as const;

export const CHAIN_ID: Record<string, number> = { "bsc-testnet": 97, "bsc-mainnet": 56 };

// Domain-separated, deterministic anchor payload. Never confuse a decision hash with another blob.
export function canonicalAnchorPayload(anchorValue: string, chain: string): Uint8Array {
  return concat([
    encodeLenPrefixed(utf8("BACKED-PROVABLE-ALPHA-ANCHOR")),
    encodeLenPrefixed(utf8(chain)),
    encodeLenPrefixed(utf8(anchorValue.startsWith("0x") ? anchorValue : "0x" + anchorValue)),
  ]);
}

/** Deterministic anchor-intent hash (dry-run; no chain write). Block-time is now, NOT a chain block. */
export function anchorIntent(anchorValue: string, chain = "bsc-testnet"): AnchorReceipt {
  const intent = createHash("sha256").update(canonicalAnchorPayload(anchorValue, chain)).digest("hex");
  return {
    anchored: false,
    anchorValue,
    txHash: intent,
    blockTime: BigInt(Date.now()),
    chain,
    note: "DRY-RUN anchor intent — no chain write. Set ANCHOR_PRIVATE_KEY + ANCHOR_TO to commit for real.",
  };
}

/** Real on-chain commit: sign 0-value tx with data=anchor payload, broadcast, return tx receipt. */
export async function commitAnchorLive(
  anchorValue: string,
  opts: { chain?: string; privateKey?: string; to?: string },
): Promise<AnchorReceipt> {
  const chain = opts.chain ?? "bsc-testnet";
  const pk = opts.privateKey ?? process.env.ANCHOR_PRIVATE_KEY;
  const to = opts.to ?? process.env.ANCHOR_TO;
  if (!pk || !to) return anchorIntent(anchorValue, chain);

  const rpc = RPC[chain as keyof typeof RPC];
  const chainId = CHAIN_ID[chain];
  const provider = new ethers.JsonRpcProvider(rpc, chainId);
  const wallet = new ethers.Wallet(pk, provider);

  // The anchor blob (0x-prefixed hex of the canonical payload).
  const payload = Buffer.from(canonicalAnchorPayload(anchorValue, chain)).toString("hex");

  // Anchor to the burn address (a pure EOA — accepts a data-carrying 0-value tx). This anchors
  // the blob to the chain's timestamp without moving value. If the configured `to` is itself a
  // contract that rejects data calls, prefer an EOA recipient.
  const tx = await wallet.sendTransaction({
    to,
    value: 0n,
    data: "0x" + payload,
    gasLimit: 200000n,
  });
  const receipt = await tx.wait();
  const blockNumber = bigintOrUndefined(receipt?.blockNumber);
  const blockTime = blockNumber
    ? BigInt((await provider.getBlock(Number(blockNumber)))!.timestamp) * 1000n
    : BigInt(Date.now());

  return {
    anchored: true,
    anchorValue,
    txHash: tx.hash,
    blockTime,
    blockNumber,
    chain,
    note: `anchored onchain, block ${receipt?.blockNumber}`,
  };
}

/** High-level helper: LIVE if key+to present, else deterministic ANCHOR-INTENT. */
export async function anchorDecisionHash(
  anchorValue: string,
  opts?: { chain?: string; privateKey?: string; to?: string },
): Promise<AnchorReceipt> {
  const pk = opts?.privateKey ?? process.env.ANCHOR_PRIVATE_KEY;
  const to = opts?.to ?? process.env.ANCHOR_TO;
  if (pk && to) return commitAnchorLive(anchorValue, { chain: opts?.chain, privateKey: pk, to });
  return anchorIntent(anchorValue, opts?.chain);
}

// helper
function bigintOrUndefined(n: number | bigint | undefined | null): bigint | undefined {
  if (n === undefined || n === null) return undefined;
  return BigInt(n);
}

export { createHash };
