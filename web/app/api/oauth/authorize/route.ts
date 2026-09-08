import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const redirectUri = url.searchParams.get("redirect_uri");
  const state = url.searchParams.get("state") || "";

  if (redirectUri) {
    const callbackUrl = new URL(redirectUri);
    callbackUrl.searchParams.set("code", "backed_auth_grant_" + Date.now());
    if (state) callbackUrl.searchParams.set("state", state);
    return NextResponse.redirect(callbackUrl.toString(), 302);
  }

  return NextResponse.json({ ok: true, message: "Authorized by BACKED Public Oracle" });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
