import { NextRequest, NextResponse } from "next/server";
import { startOAuth } from "@/lib/mcp";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { url, verifier, state } = startOAuth();
    return NextResponse.json({ url, verifier, state });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
