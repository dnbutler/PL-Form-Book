import { getDb } from "./client";
import type { TeamMatchInput, H2HContextRow } from "@/lib/types/inputs";
import type { ModelVersion } from "@/lib/types/model";

export async function getActiveModelVersion(): Promise<ModelVersion> {
  const db = getDb();

  const { data: version, error: versionError } = await db
    .from("model_versions")
    .select("id, version_key, name, description, is_active")
    .eq("is_active", true)
    .single();

  if (versionError || !version) {
    throw new Error(
      `Could not load active model version: ${versionError?.message ?? "No row returned"}`
    );
  }

  const { data: weights, error: weightsError } = await db
    .from("model_factor_weights")
    .select("factor_key, factor_name, weight_pct")
    .eq("model_version_id", version.id)
    .order("factor_key", { ascending: true });

  if (weightsError || !weights) {
    throw new Error(`Could not load model weights: ${weightsError.message}`);
  }

  return {
    id: version.id,
    versionKey: version.version_key,
    name: version.name,
    description: version.description,
    isActive: version.is_active,
    factorWeights: weights.map((w) => ({
      factorKey: w.factor_key,
      factorName: w.factor_name,
      weightPct: Number(w.weight_pct),
    })),
  };
}

export async function getFixtureInputs(
  fixtureId: string
): Promise<{ home: TeamMatchInput; away: TeamMatchInput }> {
  const db = getDb();

  const { data, error } = await db
    .from("team_match_inputs")
    .select("*")
    .eq("fixture_id", fixtureId);

  if (error || !data || data.length !== 2) {
    throw new Error(
      `Could not load team_match_inputs for fixture ${fixtureId}: ${error?.message ?? "Need exactly 2 rows"}`
    );
  }

  const home = data.find((row) => row.is_home === true);
  const away = data.find((row) => row.is_home === false);

  if (!home || !away) {
    throw new Error(`Fixture ${fixtureId} does not have both home and away inputs`);
  }

  return {
    home: mapTeamMatchInput(home),
    away: mapTeamMatchInput(away),
  };
}

export async function getFixtureH2H(fixtureId: string): Promise<H2HContextRow[]> {
  const db = getDb();

  const { data, error } = await db
    .from("fixture_h2h_history")
    .select(
      "prior_fixture_date, result_for_home_team, recency_multiplier, context_multiplier, weighted_result"
    )
    .eq("fixture_id", fixtureId)
    .order("prior_fixture_date", { ascending: false });

  if (error) {
    throw new Error(`Could not load H2H context for fixture ${fixtureId}: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    priorFixtureDate: row.prior_fixture_date,
    resultForHomeTeam: row.result_for_home_team,
    recencyMultiplier:
      row.recency_multiplier == null ? null : Number(row.recency_multiplier),
    contextMultiplier:
      row.context_multiplier == null ? null : Number(row.context_multiplier),
    weightedResult: row.weighted_result == null ? null : Number(row.weighted_result),
  }));
}

function mapTeamMatchInput(row: any): TeamMatchInput {
  return {
    fixtureId: row.fixture_id,
    teamId: row.team_id,
    opponentTeamId: row.opponent_team_id,
    isHome: row.is_home,

    tablePosition: row.table_position,
    pointsPerGame: numeric(row.points_per_game),
    goalDiffPerGame: numeric(row.goal_diff_per_game),

    last3Points: row.last_3_points,
    last5Points: row.last_5_points,
    last5GoalsFor: row.last_5_goals_for,
    last5GoalsAgainst: row.last_5_goals_against,

    homePointsPerGame: numeric(row.home_points_per_game),
    awayPointsPerGame: numeric(row.away_points_per_game),
    homeGoalDiffPerGame: numeric(row.home_goal_diff_per_game),
    awayGoalDiffPerGame: numeric(row.away_goal_diff_per_game),

    scoringMatchesLast5: row.scoring_matches_last_5,
    cleanSheetsLast5: row.clean_sheets_last_5,
    failedToScoreLast5: row.failed_to_score_last_5,
    conceded2PlusLast5: row.conceded_2plus_last_5,

    missingStartersCount: row.missing_starters_count,
    missingKeyAttacker: row.missing_key_attacker,
    missingKeyDefender: row.missing_key_defender,
    missingGoalkeeper: row.missing_goalkeeper,

    daysRest: row.days_rest,
    hadMidweekMatch: row.had_midweek_match,
  };
}

function numeric(value: unknown): number | null {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}