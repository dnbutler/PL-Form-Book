import type { TeamMatchInput, H2HContextRow } from "@/lib/types/inputs";
import type { FactorKey } from "@/lib/types/model";

export interface RawFactorScores {
  form: number;
  venue: number;
  attack: number;
  defence: number;
  league: number;
  availability: number;
  h2h: number;
  rest: number;
}

export const factorLabels: Record<FactorKey, string> = {
  form: "Current-season form",
  venue: "Home/away strength",
  attack: "Attack trend",
  defence: "Defence trend",
  league: "League strength",
  availability: "Squad availability",
  h2h: "Head-to-head",
  rest: "Rest / congestion",
};

export function buildFactorScores(params: { team: TeamMatchInput; h2hRows: H2HContextRow[]; side: "home" | "away"; }): RawFactorScores {
  const { team, h2hRows, side } = params;
  return {
    form: formScore(team),
    venue: venueScore(team, side),
    attack: attackScore(team),
    defence: defenceScore(team),
    league: leagueScore(team),
    availability: availabilityScore(team),
    h2h: h2hScore(h2hRows, side),
    rest: restScore(team),
  };
}

function formScore(team: TeamMatchInput) {
  const last3 = clamp((safe(team.last3Points) / 9) * 4.5, 0, 4.5);
  const last5 = clamp((safe(team.last5Points) / 15) * 3.5, 0, 3.5);
  const gd = safe(team.last5GoalsFor) - safe(team.last5GoalsAgainst);
  return round2(last3 + last5 + clamp(((gd + 5) / 10) * 2, 0, 2));
}
function venueScore(team: TeamMatchInput, side: "home" | "away") {
  const ppg = side === "home" ? safe(team.homePointsPerGame) : safe(team.awayPointsPerGame);
  const gdpg = side === "home" ? safe(team.homeGoalDiffPerGame) : safe(team.awayGoalDiffPerGame);
  return round2(clamp((ppg / 3) * 6, 0, 6) + clamp(((gdpg + 2) / 4) * 4, 0, 4));
}
function attackScore(team: TeamMatchInput) {
  return round2(clamp((safe(team.last5GoalsFor) / 10) * 5, 0, 5) + clamp((safe(team.scoringMatchesLast5) / 5) * 3, 0, 3) + 2 * (1 - clamp(safe(team.failedToScoreLast5) / 5, 0, 1)));
}
function defenceScore(team: TeamMatchInput) {
  return round2(4 * (1 - clamp(safe(team.last5GoalsAgainst) / 10, 0, 1)) + clamp((safe(team.cleanSheetsLast5) / 5) * 3, 0, 3) + 3 * (1 - clamp(safe(team.conceded2PlusLast5) / 5, 0, 1)));
}
function leagueScore(team: TeamMatchInput) {
  const position = team.tablePosition ?? 20;
  const tableComponent = 1 - (position - 1) / 19;
  return round2(clamp(tableComponent * 4, 0, 4) + clamp((safe(team.pointsPerGame) / 3) * 3.5, 0, 3.5) + clamp(((safe(team.goalDiffPerGame) + 2) / 4) * 2.5, 0, 2.5));
}
function availabilityScore(team: TeamMatchInput) {
  const score = 10 - 0.8 * safe(team.missingStartersCount) - 1.5 * boolNum(team.missingKeyAttacker) - 1.2 * boolNum(team.missingKeyDefender) - 2 * boolNum(team.missingGoalkeeper);
  return round2(clamp(score, 0, 10));
}
function h2hScore(rows: H2HContextRow[], side: "home" | "away") {
  if (!rows.length) return 5;
  let numerator = 0; let denominator = 0;
  for (const row of rows) {
    const weight = safe(row.recencyMultiplier, 1) * safe(row.contextMultiplier, 1);
    const resultPoints = side === "home" ? mapH2HResult(row.resultForHomeTeam) : mapAwayPerspective(row.resultForHomeTeam);
    numerator += resultPoints * weight; denominator += weight;
  }
  return denominator === 0 ? 5 : round2(clamp((numerator / denominator) * 10, 0, 10));
}
function restScore(team: TeamMatchInput) {
  return round2(clamp((safe(team.daysRest) / 7) * 7, 0, 7) + 3 * (1 - boolNum(team.hadMidweekMatch)));
}
function mapH2HResult(result: "H"|"D"|"A") { return result === "H" ? 1 : result === "D" ? 0.5 : 0; }
function mapAwayPerspective(result: "H"|"D"|"A") { return result === "A" ? 1 : result === "D" ? 0.5 : 0; }
function safe(value: number | null | undefined, fallback = 0) { return value == null ? fallback : value; }
function boolNum(value: boolean | null | undefined) { return value ? 1 : 0; }
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function round2(value: number) { return Math.round(value * 100) / 100; }
