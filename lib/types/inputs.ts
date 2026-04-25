export interface TeamMatchInput {
  fixtureId: string;
  teamId: string;
  opponentTeamId: string;
  isHome: boolean;
  tablePosition: number | null;
  pointsPerGame: number | null;
  goalDiffPerGame: number | null;
  last3Points: number | null;
  last5Points: number | null;
  last5GoalsFor: number | null;
  last5GoalsAgainst: number | null;
  homePointsPerGame: number | null;
  awayPointsPerGame: number | null;
  homeGoalDiffPerGame: number | null;
  awayGoalDiffPerGame: number | null;
  scoringMatchesLast5: number | null;
  cleanSheetsLast5: number | null;
  failedToScoreLast5: number | null;
  conceded2PlusLast5: number | null;
  missingStartersCount: number | null;
  missingKeyAttacker: boolean | null;
  missingKeyDefender: boolean | null;
  missingGoalkeeper: boolean | null;
  daysRest: number | null;
  hadMidweekMatch: boolean | null;
}

export interface H2HContextRow {
  priorFixtureDate: string;
  resultForHomeTeam: "H" | "D" | "A";
  recencyMultiplier: number | null;
  contextMultiplier: number | null;
  weightedResult: number | null;
}
