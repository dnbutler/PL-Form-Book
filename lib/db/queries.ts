import { getDb, hasDbEnv } from "./client";
import { demoFixtures } from "./demo";
import type { ModelVersion } from "@/lib/types/model";
import type { TeamMatchInput, H2HContextRow } from "@/lib/types/inputs";

export async function getActiveModelVersion(): Promise<ModelVersion> {
  if (!hasDbEnv) {
    return {
      id: "demo-model",
      versionKey: "v1_form_rules_001",
      name: "V1 form rules",
      description: "Demo model",
      isActive: true,
      factorWeights: [
        { factorKey: "form", factorName: "Current-season form", weightPct: 24 },
        { factorKey: "venue", factorName: "Home/away strength", weightPct: 18 },
        { factorKey: "attack", factorName: "Attack trend", weightPct: 14 },
        { factorKey: "defence", factorName: "Defence trend", weightPct: 14 },
        { factorKey: "league", factorName: "League strength", weightPct: 10 },
        { factorKey: "availability", factorName: "Squad availability", weightPct: 12 },
        { factorKey: "h2h", factorName: "Head-to-head", weightPct: 5 },
        { factorKey: "rest", factorName: "Rest / congestion", weightPct: 3 }
      ]
    };
  }
  const db = getDb();
  const { data: version } = await db.from("model_versions").select("id, version_key, name, description, is_active").eq("is_active", true).single();
  if (!version) throw new Error("Could not load active model version");
  const { data: weights } = await db.from("model_factor_weights").select("factor_key, factor_name, weight_pct").eq("model_version_id", version.id);
  return {
    id: version.id,
    versionKey: version.version_key,
    name: version.name,
    description: version.description,
    isActive: version.is_active,
    factorWeights: (weights ?? []).map((w: any) => ({ factorKey: w.factor_key, factorName: w.factor_name, weightPct: Number(w.weight_pct) }))
  };
}

export async function listPredictions() {
  if (!hasDbEnv) return demoFixtures;
  const db = getDb();
  const { data } = await db.from("v_fixture_predictions").select("*").order("kickoff_at", { ascending: true });
  return data ?? [];
}

export async function getFixtureInputs(_fixtureId: string): Promise<{ home: TeamMatchInput; away: TeamMatchInput }> {
  return {
    home: { fixtureId: "demo", teamId: "home", opponentTeamId: "away", isHome: true, tablePosition: 5, pointsPerGame: 1.8, goalDiffPerGame: 0.6, last3Points: 7, last5Points: 10, last5GoalsFor: 8, last5GoalsAgainst: 4, homePointsPerGame: 2.0, awayPointsPerGame: 0, homeGoalDiffPerGame: 0.8, awayGoalDiffPerGame: 0, scoringMatchesLast5: 4, cleanSheetsLast5: 2, failedToScoreLast5: 1, conceded2PlusLast5: 1, missingStartersCount: 1, missingKeyAttacker: false, missingKeyDefender: false, missingGoalkeeper: false, daysRest: 6, hadMidweekMatch: false },
    away: { fixtureId: "demo", teamId: "away", opponentTeamId: "home", isHome: false, tablePosition: 12, pointsPerGame: 1.2, goalDiffPerGame: -0.2, last3Points: 4, last5Points: 6, last5GoalsFor: 5, last5GoalsAgainst: 7, homePointsPerGame: 0, awayPointsPerGame: 1.0, homeGoalDiffPerGame: 0, awayGoalDiffPerGame: -0.4, scoringMatchesLast5: 3, cleanSheetsLast5: 1, failedToScoreLast5: 2, conceded2PlusLast5: 2, missingStartersCount: 2, missingKeyAttacker: true, missingKeyDefender: false, missingGoalkeeper: false, daysRest: 4, hadMidweekMatch: true }
  };
}

export async function getFixtureH2H(_fixtureId: string): Promise<H2HContextRow[]> {
  return [
    { priorFixtureDate: "2025-11-22", resultForHomeTeam: "H", recencyMultiplier: 1, contextMultiplier: 1, weightedResult: 1 },
    { priorFixtureDate: "2025-03-01", resultForHomeTeam: "D", recencyMultiplier: 0.5, contextMultiplier: 0.7, weightedResult: 0.175 }
  ];
}
