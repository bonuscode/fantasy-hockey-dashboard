declare module "yahoo-fantasy" {
  class YahooFantasy {
    constructor(
      clientId: string,
      clientSecret: string,
      tokenCallback?: (error: unknown, token: unknown) => void,
      redirectUri?: string
    );

    setUserToken(token: string): void;
    setRefreshToken(token: string): void;

    league: {
      meta(leagueKey: string): Promise<unknown>;
      settings(leagueKey: string): Promise<unknown>;
      standings(leagueKey: string): Promise<unknown>;
      scoreboard(leagueKey: string, week?: number): Promise<unknown>;
      players(leagueKey: string): Promise<unknown>;
      transactions(leagueKey: string): Promise<unknown>;
      draftresults(leagueKey: string): Promise<unknown>;
      teams(leagueKey: string): Promise<unknown>;
    };

    team: {
      meta(teamKey: string): Promise<unknown>;
      roster(teamKey: string): Promise<unknown>;
      stats(teamKey: string): Promise<unknown>;
    };

    player: {
      meta(playerKey: string): Promise<unknown>;
      stats(playerKey: string): Promise<unknown>;
    };

    roster: {
      players(
        teamKey: string,
        ...args: unknown[]
      ): Promise<unknown>;
    };
  }

  export default YahooFantasy;
}
