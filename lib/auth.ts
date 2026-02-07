const YAHOO_AUTH_URL = "https://api.login.yahoo.com/oauth2/request_auth";
const YAHOO_TOKEN_URL = "https://api.login.yahoo.com/oauth2/get_token";

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
