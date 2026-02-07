import { NextResponse } from "next/server";

export async function GET() {
  // For MVP: simply redirect to home
  // In production: clear session/cookies
  return NextResponse.redirect(new URL("/", process.env.YAHOO_REDIRECT_URI || "http://localhost:3000"));
}
