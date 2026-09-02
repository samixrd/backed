import { NextResponse } from "next/server";
import { getStatus } from "@/lib/mcp";

export const runtime = "nodejs";

export async function GET() {
  try {
    const s = await getStatus();
    return NextResponse.json(s);
  } catch (e: any) {
    return NextResponse.json({ connected: false, error: e.message });
  }
}
