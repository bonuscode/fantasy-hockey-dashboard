import YahooFantasy from "yahoo-fantasy";
import { getAuthTokens, AuthError } from "@/lib/auth";

let yahooClient: InstanceType<typeof YahooFantasy> | null = null;

function tokenCallback(error: unknown, token: unknown) {
  if (error) {
    console.error("Token refresh error:", error);
    return;
  }
  console.log("Token refreshed successfully", token);
}

function initYahooClient() {
  if (!yahooClient) {
    yahooClient = new YahooFantasy(
      process.env.YAHOO_CLIENT_ID!,
      process.env.YAHOO_CLIENT_SECRET!,
      tokenCallback,
      process.env.YAHOO_REDIRECT_URI
    );
  }
  return yahooClient;
}

/**
 * Returns an authenticated Yahoo Fantasy client.
 * Reads tokens from cookies, auto-refreshes if expired.
 * Throws AuthError if user is not authenticated.
 */
export async function getYahooClient() {
  const tokens = await getAuthTokens();
  if (!tokens) {
    throw new AuthError();
  }

  const client = initYahooClient();
  client.setUserToken(tokens.accessToken);
  client.setRefreshToken(tokens.refreshToken);

  return client;
}

export function getLeagueKey() {
  const gameKey = process.env.YAHOO_GAME_KEY || "nhl";
  const leagueId = process.env.YAHOO_LEAGUE_ID || "";
  return `${gameKey}.l.${leagueId}`;
}
