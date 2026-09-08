import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const clientId = `backed_client_${Date.now()}`;
  const clientSecret = `backed_secret_${Math.random().toString(36).substring(2)}`;

  return NextResponse.json(
    {
      client_id: clientId,
      client_secret: clientSecret,
      client_name: body.client_name || "Claude",
      redirect_uris: body.redirect_uris || [],
      grant_types: body.grant_types || ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "client_secret_post",
    },
    {
      status: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
