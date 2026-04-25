import type { FixtureListItem, UserPreferencesResponse } from "@/lib/types/api";

export const demoTeams = [
  { id: "ARS", name: "Arsenal", short_name: "ARS", code: "ARS" },
  { id: "AVL", name: "Aston Villa", short_name: "AVL", code: "AVL" },
  { id: "BRE", name: "Brentford", short_name: "BRE", code: "BRE" },
  { id: "CRY", name: "Crystal Palace", short_name: "CRY", code: "CRY" },
  { id: "EVE", name: "Everton", short_name: "EVE", code: "EVE" },
  { id: "FUL", name: "Fulham", short_name: "FUL", code: "FUL" },
  { id: "LIV", name: "Liverpool", short_name: "LIV", code: "LIV" },
  { id: "MUN", name: "Manchester United", short_name: "MUN", code: "MUN" },
  { id: "NEW", name: "Newcastle United", short_name: "NEW", code: "NEW" },
  { id: "NFO", name: "Nottingham Forest", short_name: "NFO", code: "NFO" },
  { id: "SUN", name: "Sunderland", short_name: "SUN", code: "SUN" },
  { id: "TOT", name: "Tottenham Hotspur", short_name: "TOT", code: "TOT" },
  { id: "WHU", name: "West Ham United", short_name: "WHU", code: "WHU" },
  { id: "WOL", name: "Wolverhampton Wanderers", short_name: "WOL", code: "WOL" },
];

export const demoFixtures: FixtureListItem[] = [
  { fixtureId: "1", kickoffAt: "2026-04-24T19:00:00Z", gameweek: 35, status: "scheduled", homeTeam: { id: "SUN", name: "Sunderland", shortName: "SUN" }, awayTeam: { id: "NFO", name: "Nottingham Forest", shortName: "NFO" }, prediction: { predictionId: "p1", modelVersion: "v1_form_rules_001", homeProb: 33, drawProb: 35, awayProb: 32, verdict: "Draw lean", confidence: "Low", rationale: "Both sides rate closely on the main V1 signals." }, evaluation: null },
  { fixtureId: "2", kickoffAt: "2026-04-25T11:30:00Z", gameweek: 35, status: "scheduled", homeTeam: { id: "FUL", name: "Fulham", shortName: "FUL" }, awayTeam: { id: "AVL", name: "Aston Villa", shortName: "AVL" }, prediction: { predictionId: "p2", modelVersion: "v1_form_rules_001", homeProb: 24, drawProb: 28, awayProb: 48, verdict: "Away win lean", confidence: "Medium", rationale: "Villa rate stronger on form and attack trend." }, evaluation: null },
  { fixtureId: "3", kickoffAt: "2026-04-25T14:00:00Z", gameweek: 35, status: "completed", homeTeam: { id: "LIV", name: "Liverpool", shortName: "LIV" }, awayTeam: { id: "CRY", name: "Crystal Palace", shortName: "CRY" }, prediction: { predictionId: "p3", modelVersion: "v1_form_rules_001", homeProb: 57, drawProb: 24, awayProb: 19, verdict: "Home win", confidence: "Medium", rationale: "Liverpool's venue strength and attack trend create the edge." }, evaluation: { actualHomeGoals: 2, actualAwayGoals: 1, actualResult: "H", correct1x2: true, selfMark: 2 } },
  { fixtureId: "4", kickoffAt: "2026-04-25T14:00:00Z", gameweek: 35, status: "completed", homeTeam: { id: "WHU", name: "West Ham United", shortName: "WHU" }, awayTeam: { id: "EVE", name: "Everton", shortName: "EVE" }, prediction: { predictionId: "p4", modelVersion: "v1_form_rules_001", homeProb: 28, drawProb: 31, awayProb: 41, verdict: "Away win lean", confidence: "Low", rationale: "Everton's recent body of work is a touch stronger." }, evaluation: { actualHomeGoals: 1, actualAwayGoals: 1, actualResult: "D", correct1x2: false, selfMark: 1 } },
  { fixtureId: "5", kickoffAt: "2026-04-25T14:00:00Z", gameweek: 35, status: "scheduled", homeTeam: { id: "WOL", name: "Wolverhampton Wanderers", shortName: "WOL" }, awayTeam: { id: "TOT", name: "Tottenham Hotspur", shortName: "TOT" }, prediction: { predictionId: "p5", modelVersion: "v1_form_rules_001", homeProb: 29, drawProb: 36, awayProb: 35, verdict: "Draw lean", confidence: "Low", rationale: "Neither side has earned trust." }, evaluation: null },
  { fixtureId: "6", kickoffAt: "2026-04-25T16:30:00Z", gameweek: 35, status: "scheduled", homeTeam: { id: "ARS", name: "Arsenal", shortName: "ARS" }, awayTeam: { id: "NEW", name: "Newcastle United", shortName: "NEW" }, prediction: { predictionId: "p6", modelVersion: "v1_form_rules_001", homeProb: 61, drawProb: 23, awayProb: 16, verdict: "Home win", confidence: "High", rationale: "Arsenal remain materially stronger at home." }, evaluation: null },
  { fixtureId: "7", kickoffAt: "2026-04-27T19:00:00Z", gameweek: 35, status: "scheduled", homeTeam: { id: "MUN", name: "Manchester United", shortName: "MUN" }, awayTeam: { id: "BRE", name: "Brentford", shortName: "BRE" }, prediction: { predictionId: "p7", modelVersion: "v1_form_rules_001", homeProb: 49, drawProb: 29, awayProb: 22, verdict: "Home win lean", confidence: "Medium", rationale: "United own the stronger season profile." }, evaluation: null },
];

export const demoPreferences: UserPreferencesResponse = { focusTeamId: null, highlightFocusFixtures: true };
