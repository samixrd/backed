/**
 * lib/mcp.ts — thin wrapper so the web app can use the Binance MCP client (from ../src).
 *
 * The web app (Next.js) and the core trust engine share the repo. We re-export the real MCP
 * client from the parent src so there's one source of truth for the OAuth flow + tool discovery.
 * Access token is cached in-memory (and from env MCP_ACCESS_TOKEN) to survive re-renders.
 */

import { McpClient } from "@core/mcp-client";

interface Tokens {
  access: string;
  verifier: string;
  state: string;
  at: number;
}

const ttl = 45 * 60 * 1000; // 45 min

const globalCache: Partial<Record<string, Tokens>> = {};

function tok(): Tokens | null {
  if (globalCache.backed) {
    const c = globalCache.backed;
    if (Date.now() - c.at < ttl) return c;
  }
  return null;
}

export function startOAuth() {
  const client = new McpClient({ clientId: "backed-agent" });
  const { url, verifier, state } = client.createAuthRequest();
  globalCache.backed = { access: "", verifier, state, at: Date.now() };
  return { url, verifier, state };
}

export async function completeOAuth(code: string, verifier: string, state: string) {
  const cached = globalCache.backed;
  if (cached && cached.state !== state) throw new Error("state mismatch (possible CSRF)");
  const client = new McpClient({ clientId: "backed-agent" });
  const access = await client.exchangeCode(code, verifier);
  if (!globalCache.backed) globalCache.backed = { access: "", verifier, state, at: Date.now() };
  else globalCache.backed.access = access;
  return access;
}

let cachedTools: { name: string; description?: string }[] | null = null;

export async function getStatus() {
  const t = tok();
  if (!t || !t.access) return { connected: false };
  const client = new McpClient({ clientId: "backed-agent", accessToken: t.access });
  try {
    const tools = (await client.tools()).map((x) => ({ name: x.name, description: x.description }));
    cachedTools = tools;
    return { connected: true, tools };
  } catch (e: any) {
    return { connected: true, tools: cachedTools ?? [], error: e.message };
  }
}

export { McpClient };
