import { cookies } from "next/headers";

const YAHOO_AUTH_URL = "https://api.login.yahoo.com/oauth2/request_auth";
const YAHOO_TOKEN_URL = "https://api.login.yahoo.com/oauth2/get_token";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
};

export class AuthError extends Error {
  constructor(message = "Not authenticated") {
    super(message);
    this.name = "AuthError";
  }
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Reads tokens from cookies, auto-refreshes if expired.
 * Returns tokens or null if not authenticated.
 */
export async function getAuthTokens(): Promise<AuthTokens | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("yahoo_access_token")?.value;
  const refreshToken = cookieStore.get("yahoo_refresh_token")?.value;
  const tokenExpiry = cookieStore.get("yahoo_token_expiry")?.value;

  if (!refreshToken) return null;

  // If access token exists and not expired (with 5-min buffer), return as-is
  if (accessToken && tokenExpiry) {
    const expiresAt = parseInt(tokenExpiry);
    if (Date.now() < expiresAt - 5 * 60 * 1000) {
      return { accessToken, refreshToken };
    }
  }

  // Token is missing or expired — attempt refresh
  try {
    const newTokens = await refreshAccessToken(refreshToken);
    const newExpiry = Date.now() + newTokens.expires_in * 1000;

    cookieStore.set("yahoo_access_token", newTokens.access_token, {
      ...COOKIE_OPTIONS,
      maxAge: newTokens.expires_in,
    });

    if (newTokens.refresh_token) {
      cookieStore.set("yahoo_refresh_token", newTokens.refresh_token, {
        ...COOKIE_OPTIONS,
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    cookieStore.set("yahoo_token_expiry", String(newExpiry), {
      ...COOKIE_OPTIONS,
      maxAge: 30 * 24 * 60 * 60,
    });

    return {
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token || refreshToken,
    };
  } catch {
    return null;
  }
}

export function getAuthorizationUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.YAHOO_CLIENT_ID!,
    redirect_uri: process.env.YAHOO_REDIRECT_URI!,
    response_type: "code",
    language: "en-us",
  });

  return `${YAHOO_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const response = await fetch(YAHOO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.YAHOO_CLIENT_ID}:${process.env.YAHOO_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.YAHOO_REDIRECT_URI!,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }

  return response.json();
}

export async function refreshAccessToken(refreshToken: string) {
  const response = await fetch(YAHOO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.YAHOO_CLIENT_ID}:${process.env.YAHOO_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      redirect_uri: process.env.YAHOO_REDIRECT_URI!,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

  return response.json();
}
