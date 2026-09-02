/**
 * canonical.ts — byte-deterministic serialization for the Provable Alpha trust engine.
 *
 * The whole integrity guarantee rests on ONE property: the canonical form of a Decision
 * (or Evidence) must be a pure, injective, reproducible byte string. Same inputs → same bytes
 * → same SHA256. Any nondeterminism here breaks hash-chain verification, so this module:
 *
 *  - encodes in a STRICT field order (no dict/JSON ordering ambiguity),
 *  - length-prefixes strings (prevents ["a","bc"] vs ["ab","c"] collisions),
 *  - encodes integers big-endian fixed-width,
 *  - uses NO floating point (all monetary/qty math is integer fixed-point),
 *  - inserts '\n' separators between fields as an extra structural boundary.
 */

// ---- integer codec -----------------------------------------------------------
// Big-endian fixed-width, minimal bytes. Throws on negative or overflow beyond 8 bytes.
export function encodeU64(n: bigint | number): Uint8Array {
  const v = typeof n === "number" ? BigInt(n) : n;
  if (v < 0n) throw new Error("encodeU64: negative");
  if (v > 0xffffffffffffffffn) throw new Error("encodeU64: > u64");
  const buf = new Uint8Array(8);
  let x = v;
  for (let i = 7; i >= 0; i--) {
    buf[i] = Number(x & 0xffn);
    x >>= 8n;
  }
  return buf;
}

// Variable-length but still unambiguous (used for qty / nonce which may exceed u64 in demo).
export function encodeU256(n: bigint | number): Uint8Array {
  const v = typeof n === "number" ? BigInt(n) : n;
  if (v < 0n) throw new Error("encodeU256: negative");
  if (v === 0n) return new Uint8Array([0]);
  const bytes: number[] = [];
  let x = v;
  while (x > 0n) {
    bytes.push(Number(x & 0xffn));
    x >>= 8n;
  }
  // big-endian: reverse, then length-prefix to keep it self-delimiting
  const raw = new Uint8Array(bytes.reverse());
  const out = new Uint8Array(1 + raw.length);
  out[0] = raw.length;
  out.set(raw, 1);
  return out;
}

// Length-prefixed bytes (self-delimiting string/bytes). Prevents concatenation collisions.
export function encodeLenPrefixed(bytes: Uint8Array): Uint8Array {
  const len = encodeU64(BigInt(bytes.length));
  const out = new Uint8Array(8 + bytes.length);
  out.set(len, 0);
  out.set(bytes, 8);
  return out;
}

export function utf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

export function hex(buf: Uint8Array): string {
  return Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function fromHex(s: string): Uint8Array {
  const clean = s.startsWith("0x") ? s.slice(2) : s;
  if (clean.length % 2 !== 0) throw new Error("fromHex: odd length");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

// Concatenate a list of byte chunks.
export function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}
