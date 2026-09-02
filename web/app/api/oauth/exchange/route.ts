import { NextRequest, NextResponse } from "next/server";
import { completeOAuth } from "@/lib/mcp";

export const runtime = "nodejs";

// Client POSTs {code, verifier, state} after capture from the /?code=...&state=... redirect.
export async function POST(req: NextRequest) {
  try {
    const { code, verifier, state } = await req.json();
    if (!code || !verifier) return NextResponse.json({ error: "missing code or verifier" }, { status: 400 });
    const access = await completeOAuth(code, verifier, state ?? "");
    return NextResponse.json({ ok: true, connected: true, accessTokenSet: !!access });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
