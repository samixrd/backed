import { NextRequest, NextResponse } from "next/server";
import { completeOAuth } from "@/lib/mcp";

export const runtime = "nodejs";

// Binance redirects here after approval: /oauth/callback?code=...&state=...
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");

  if (error) return NextResponse.redirect(new URL(`/?oauth_error=${error}`, req.url));

  if (!code) return NextResponse.redirect(new URL("/?oauth_error=no_code", req.url));

  // We need the verifier that was stashed in sessionStorage by /api/oauth/start.
  // The browser sessionStorage isn't readable server-side, so the client passes it along.
  // In practice the client calls this route via POST with {@code, verifier, state}. The GET here
  // captures Binance's redirect; the client then POSTs to /api/oauth/exchange to finish.
  return NextResponse.redirect(
    new URL(`/?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state ?? "")}`, req.url),
  );
}
