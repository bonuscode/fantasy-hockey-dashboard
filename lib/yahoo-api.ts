import YahooFantasy from "yahoo-fantasy";

let yahooClient: InstanceType<typeof YahooFantasy> | null = null;

function tokenCallback(error: unknown, token: unknown) {
  if (error) {
    console.error("Token refresh error:", error);
    return;
  }
  console.log("Token refreshed successfully", token);
}

export function initYahooClient() {
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

export async function getYahooClient() {
  const client = initYahooClient();

  const accessToken = process.env.YAHOO_ACCESS_TOKEN || "";
  const refreshToken = process.env.YAHOO_REFRESH_TOKEN || "";

  client.setUserToken(accessToken);
  client.setRefreshToken(refreshToken);

  return client;
}

export function getLeagueKey() {
  const gameKey = process.env.YAHOO_GAME_KEY || "nhl";
  const leagueId = process.env.YAHOO_LEAGUE_ID || "";
  return `${gameKey}.l.${leagueId}`;
}
