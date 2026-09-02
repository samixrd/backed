/**
 * reasoning.ts — strategy reasoning for the Fund Agent.
 *
 * Providers:
 *   - Azure OpenAI gpt-4o-mini (if AZURE_OPENAI_API_KEY set): the "brain". Reads the corroborated
 *     market snapshot, returns a decision rationale. The rationale is hashed to reasonHash and
 *     DISCARDED — the raw string never leaves the agent (IP preservation).
 *   - Deterministic fallback (no key): a transparent, reproducible rule so the demo runs offline.
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
  rationale: string; // public label; hashed to reasonHash
  mode: "gpt" | "deterministic";
  model?: string;
  provider?: "azure" | "openai" | "bai";
}

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/** Deterministic rule — transparent and reproducible. Used when no GPT key is present. */
export function deterministicReasoning(sum: SnapshotSummary): Reasoning {
  const fg = sum.fearGreed ?? 50;
  const trendUp = fg < 50; // "fear" regime — contrarian long (demo only)
  return {
    rationale:
      `DEMO rule: F&G=${fg} (${fg < 50 ? "fear" : "greed"}), ` +
      `correlated median=$${sum.medianPriceUsd.toFixed(0)}. ` +
      (trendUp ? "Contrarian BUY signal." : "Momentum SELL signal."),
    mode: "deterministic",
  };
}

function buildPrompt(sum: SnapshotSummary): string {
  return (
    `You are a demo trading agent for a provable-record demo (NOT financial advice).\n` +
    `Corroborated snapshot: ${JSON.stringify(sum)}.\n` +
    `State in one short sentence your buy/sell rationale and the key reason. No hedging, no disclaimer.\n` +
    `Return only the rationale sentence.`
  );
}

/** Azure OpenAI gpt-4o-mini — the configured brain. */
export async function azureGptReasoning(sum: SnapshotSummary): Promise<Reasoning> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;
  const key = process.env.AZURE_OPENAI_API_KEY!;
  const model = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT_NAME ?? "gpt-4o-mini";
  // Azure OpenAI (OpenAI-compatible v1): {endpoint}/chat/completions, Bearer auth, model in body.
  const res = await fetch(`${endpoint.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: buildPrompt(sum) }],
      temperature: 0.2,
      max_tokens: 120,
    }),
  });
  if (!res.ok) throw new Error(`Azure GPT-4o-mini error ${res.status}: ${await res.text()}`);
  const j: any = await res.json();
  return {
    rationale: j.choices?.[0]?.message?.content?.trim() ?? "",
    mode: "gpt",
    model,
    provider: "azure",
  };
}

/** Standard OpenAI chat — fallback if only OPENAI_API_KEY is present. */
export async function gptReasoning(sum: SnapshotSummary, apiKey: string, model = "gpt-4o-mini"): Promise<Reasoning> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: buildPrompt(sum) }],
      temperature: 0.2,
      max_tokens: 120,
    }),
  });
  if (!res.ok) throw new Error(`GPT-4o-mini error ${res.status}: ${await res.text()}`);
  const j: any = await res.json();
  return { rationale: j.choices?.[0]?.message?.content?.trim() ?? "", mode: "gpt", model, provider: "openai" };
}

/** B.AI (free) chat completions — qwen3.8-flash. Preferred free brain (deepseek free was limited). */
export async function baiGptReasoning(sum: SnapshotSummary, apiKey: string, model = "qwen3.8-flash"): Promise<Reasoning> {
  const res = await fetch("https://api.b.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: buildPrompt(sum) }],
      temperature: 0.2,
      max_tokens: 120,
    }),
  });
  if (!res.ok) throw new Error(`B.AI ${model} error ${res.status}: ${await res.text()}`);
  const j: any = await res.json();
  return {
    rationale: j.choices?.[0]?.message?.content?.trim() ?? "",
    mode: "gpt",
    model,
    provider: "bai",
  };
}

/** Pick reasoning strategy based on env: B.AI qwen free first, then Azure, then deterministic. */
export async function produceReasoning(
  sum: SnapshotSummary,
  apiKey?: string,
  model?: string,
): Promise<Reasoning> {
  // B.AI qwen3.8-flash is the free default brain (no cost, no quota like deepseek).
  const baiKey = process.env.BAI_API_KEY;
  if (baiKey) {
    try {
      return await baiGptReasoning(sum, baiKey, process.env.BAI_MODEL || "qwen3.8-flash");
    } catch (e) {
      // fall through to Azure if B.AI is down
    }
  }
  // Azure OpenAI is the configured brain.
  if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
    try {
      return await azureGptReasoning(sum);
    } catch (e) {
      return deterministicReasoning(sum);
    }
  }
  // Standard OpenAI (via OPENAI_API_KEY).
  if (apiKey) {
    try {
      return await gptReasoning(sum, apiKey, model);
    } catch (e) {
      return deterministicReasoning(sum);
    }
  }
  return deterministicReasoning(sum);
}

export { median };
