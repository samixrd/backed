/**
 * mcp-client.ts — a minimal MCP client for the Binance MCP Server (agent.binance.com/mcp/agentic).
 *
 * THIS is the real "Binance Agent OS integration" path the hackathon wants. The Binance MCP Server
 * is the official way an agent reaches Binance: it exposes tools over MCP (market data / account /
 * trade / transfer), requires OAuth (authorization_code + PKCE), and runs inside a dedicated
 * Agent sub-account with confirm-before-execute + no withdrawal.
 *
 * A standalone agent cannot call it with an API key; it must authenticate via OAuth and speak MCP
 * JSON-RPC. This module provides:
 *   - authorizeUrl()   → produce the OAuth URL for the user to approve in a browser
 *   - exchangeCode()   → swap the auth code for an access token (PKCE)
 *   - tools()          → MCP tools/list (discover the real tool names + schemas)
 *   - call()           → MCP tools/call (invoke a tool)
 *   - establish()      → initialize handshake + session
 *
 * The MCP server is the source of truth for tool names/schemas (REQUIRES VERIFICATION against the
 * live server). We discover them at runtime rather than hardcode.
 */

import { createHash, randomUUID } from "node:crypto";

const SERVER_URL = "https://agent.binance.com/mcp/agentic";
const ISSUER = "https://agent.binance.com";
const AUTHORIZE = "https://accounts.binance.com/agentic-oauth/authorize";
const TOKEN = "https://accounts.binance.com/oauth-agentic/token";
const CLIENT_ID = "backed-agent"; // MCP client id (token_endpoint_auth_methods_supported: none)

export interface McpClientConfig {
  serverUrl?: string;
  clientId?: string;
  accessToken?: string; // provided after OAuth completes
  scope?: string[];
}

export class McpClient {
  private serverUrl: string;
  private clientId: string;
  private accessToken?: string;
  private sessionId?: string;

  constructor(cfg: McpClientConfig = {}) {
    this.serverUrl = cfg.serverUrl ?? SERVER_URL;
    this.clientId = cfg.clientId ?? CLIENT_ID;
    this.accessToken = cfg.accessToken;
  }

  // ---- OAuth (authorization_code + PKCE) -----------------------------------
  static pkce(): { verifier: string; challenge: string } {
    const verifier = Array.from(createHash("sha256").update(randomUUID() + randomUUID()).digest("hex"))
      .map((c) => (Math.random() < 0.5 ? c.toUpperCase() : c))
      .join("")
      .slice(0, 128);
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    return { verifier, challenge };
  }

  /** Build the browser URL the user opens to approve the agent connection. */
  authorizeUrl(state = randomUUID()): string {
    const { challenge } = McpClient.pkce();
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: "http://localhost:3000/oauth/callback",
      scope: "marketData account trade",
      code_challenge: challenge,
      code_challenge_method: "S256",
      state,
    });
    return `${AUTHORIZE}?${params.toString()}`;
  }

  /**
   * Generate a full auth request and RETURN the verifier + state so the caller can persist them
   * (PKCE requires the verifier at token exchange, after the browser redirect round-trip).
   */
  createAuthRequest(): { url: string; verifier: string; state: string } {
    const { verifier, challenge } = McpClient.pkce();
    const state = randomUUID();
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: "http://localhost:3000/oauth/callback",
      scope: "marketData account trade",
      code_challenge: challenge,
      code_challenge_method: "S256",
      state,
    });
    return { url: `${AUTHORIZE}?${params.toString()}`, verifier, state };
  }

  /** Exchange the OAuth code (from redirect) for an access token. */
  async exchangeCode(code: string, verifier: string): Promise<string> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: this.clientId,
      code_verifier: verifier,
      redirect_uri: "http://localhost:3000/oauth/callback",
    });
    const res = await fetch(TOKEN, { method: "POST", body: body.toString() });
    if (!res.ok) throw new Error(`token exchange ${res.status}: ${await res.text()}`);
    const j: any = await res.json();
    const token: string = j.access_token;
    if (!token) throw new Error("token exchange returned no access_token");
    this.accessToken = token;
    return token;
  }

  // ---- MCP JSON-RPC over HTTP ----------------------------------------------
  private async rpc(method: string, params: any) {
    const res = await fetch(this.serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: randomUUID(), method, params }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`rpc ${method} ${res.status}: ${text.slice(0, 200)}`);
    // Handle SSE framing if present (lines after "data: ").
    const parsed = parseMcpResponse(text);
    return parsed;
  }

  /** Initialize the MCP session (must be first). */
  async initialize(): Promise<any> {
    const r = await this.rpc("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      clientInfo: { name: "backed", version: "0.1.0" },
    });
    this.sessionId = r?.result?.sessionId;
    return r;
  }

  /** Discover the actual Binance tools (names + schemas). */
  async tools(): Promise<any[]> {
    const r = await this.rpc("tools/list", {});
    return r?.result?.tools ?? [];
  }

  /** Invoke a discovered tool. */
  async call(name: string, args: Record<string, unknown>): Promise<any> {
    const r = await this.rpc("tools/call", { name, arguments: args });
    return r?.result ?? r;
  }
}

/** Parse MCP response: JSON, or SSE (multiple `data: {...}` lines), or plain text. */
function parseMcpResponse(text: string): any {
  const s = text.trim();
  if (s.startsWith("{") && s.endsWith("}")) {
    try { return JSON.parse(s); } catch { /* fall through */ }
  }
  // SSE framed
  const datas = Array.from(s.matchAll(/data: (\{.*\})/g)).map((m) => JSON.parse(m[1]));
  if (datas.length) return datas[datas.length - 1];
  try { return JSON.parse(s); } catch { return { result: s }; }
}

export { SERVER_URL, ISSUER, AUTHORIZE, TOKEN };
