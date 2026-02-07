import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url));

  response.cookies.delete("yahoo_access_token");
  response.cookies.delete("yahoo_refresh_token");
  response.cookies.delete("yahoo_token_expiry");

  return response;
}
