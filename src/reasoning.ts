/**
 * reasoning.ts — strategy reasoning for the Fund Agent.
 *
 * Two modes:
 *   - GPT-4o-mini (if OPENAI_API_KEY is set): the "brain". It reads the corroborated market
 *     snapshot and produces a decision rationale. The rationale is hashed to reasonHash and
 *     DISCARDED — the raw string never leaves the agent (IP preservation).
 *   - Deterministic fallback (no key): a transparent, reproducible rule so the demo runs
 *     offline. Clearly labeled so we never claim an LLM produced it when one didn't.
 *
 * IMPORTANT: this is a DEMO-strategy. It is not financial advice and makes no claim of alpha.
 * It exists to demonstrate the provable-record loop, not to be profitable.
 */

export interface SnapshotSummary {
  symbol: string;
  priceCorelated: { source: string; priceUsd: number }[];
  medianPriceUsd: number;
  maxDeviationPct: number;
  fearGreed?: number;
}

export interface Reasoning {
  rationale: string; // human-readable (public label), hashed to reasonHash
  mode: "gpt" | "deterministic";
  model?: string;
}

const SIDE_UP = "Buy the divergence, fear is high.";

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/** Deterministic rule — transparent and reproducible. Used when no GPT key is present. */
export function deterministicReasoning(sum: SnapshotSummary): Reasoning {
  // A crude, honest sentiment-cross signal: if Fear & Greed is low and price is trending up
  // vs. a simple reference, prefer BUY; else SELL. This is a DEMO rule, not alpha.
  const fg = sum.fearGreed ?? 50;
  const trendUp = fg < 50; // "fear" regime — we take the contrarian long (demo only)
  return {
    rationale:
      `DEMO rule: F&G=${fg} (${fg < 50 ? "fear" : "greed"}), ` +
      `correlated median=$${sum.medianPriceUsd.toFixed(0)}. ` +
      (trendUp ? "Contrarian BUY signal." : "Momentum SELL signal."),
    mode: "deterministic",
  };
}

/** GPT-4o-mini reasoning — only if a key is present. */
export async function gptReasoning(sum: SnapshotSummary, apiKey: string, model = "gpt-4o-mini"): Promise<Reasoning> {
  const prompt =
    `You are a demo trading agent for a provable-record demo (NOT financial advice).\n` +
    `Corroborated snapshot: ${JSON.stringify(sum)}.\n` +
    `State in one short sentence your buy/sell rationale and the key reason. No hedging, no disclaimer.\n` +
    `Return only the rationale sentence.`;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 120,
    }),
  });
  if (!res.ok) throw new Error(`GPT-4o-mini error ${res.status}: ${await res.text()}`);
  const j: any = await res.json();
  return {
    rationale: j.choices?.[0]?.message?.content?.trim() ?? "",
    mode: "gpt",
    model,
  };
}

/** Pick reasoning strategy based on env. */
export async function produceReasoning(
  sum: SnapshotSummary,
  apiKey?: string,
  model?: string,
): Promise<Reasoning> {
  if (apiKey) {
    try {
      return await gptReasoning(sum, apiKey, model);
    } catch (e) {
      // fall through to deterministic on API failure — never let the demo crash
      return deterministicReasoning(sum);
    }
  }
  return deterministicReasoning(sum);
}

export { median };
