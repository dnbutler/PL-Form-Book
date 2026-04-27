import type { ConfidenceBand } from "./prediction";

export interface FixtureListItem {
  fixtureId: string;
  kickoffAt: string;
  gameweek: number | null;
  status: string;
  homeTeam: { id: string; name: string; shortName: string; crestUrl?: string | null };
  awayTeam: { id: string; name: string; shortName: string; crestUrl?: string | null };
  prediction: null | {
    predictionId: string;
    modelVersion: string;
    homeProb: number;
    drawProb: number;
    awayProb: number;
    verdict: string;
    confidence: ConfidenceBand;
    rationale?: string;
  };
  evaluation: null | {
    actualHomeGoals: number | null;
    actualAwayGoals: number | null;
    actualResult: "H" | "D" | "A" | null;
    correct1x2: boolean | null;
    selfMark: number | null;
  };
}

export interface UserPreferencesResponse {
  focusTeamId: string | null;
  highlightFocusFixtures: boolean;
}
