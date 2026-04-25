export type FixtureStatus = "scheduled" | "in_progress" | "completed" | "postponed" | "cancelled";

export interface TeamRef {
  id: string;
  code: string;
  name: string;
  shortName: string;
}

export interface Fixture {
  id: string;
  seasonId: string;
  competitionId: string;
  gameweek: number | null;
  kickoffAt: string;
  venueName: string | null;
  homeTeam: TeamRef;
  awayTeam: TeamRef;
  status: FixtureStatus;
  actualHomeGoals: number | null;
  actualAwayGoals: number | null;
  actualResult: "H" | "D" | "A" | null;
}
