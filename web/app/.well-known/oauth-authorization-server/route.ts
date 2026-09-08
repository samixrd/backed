import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const host = req.headers.get("host") || "backed-zeta.vercel.app";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  return NextResponse.json(
    {
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/api/oauth/authorize`,
      token_endpoint: `${baseUrl}/api/oauth/token`,
      registration_endpoint: `${baseUrl}/api/oauth/register`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      token_endpoint_auth_methods_supported: ["none", "client_secret_post", "client_secret_basic"],
      code_challenge_methods_supported: ["S256", "plain"],
      scopes_supported: ["read", "write", "mcp"],
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    }
  );
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
