import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "No authorization code provided" },
      { status: 400 }
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    // For MVP: log tokens so they can be added to .env.local
    // In production, store these in a database or encrypted session
    console.log("Access Token:", tokens.access_token);
    console.log("Refresh Token:", tokens.refresh_token);
    console.log("Expires In:", tokens.expires_in);

    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
