import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const hasTokens = !!cookieStore.get("yahoo_access_token")?.value;

  return NextResponse.json({ authenticated: hasTokens });
}
