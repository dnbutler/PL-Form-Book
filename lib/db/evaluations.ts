import { getDb, hasDbEnv } from "./client";
import { computeBrierScore } from "@/lib/domain/evaluation/brier-score";
import { computeLogLoss } from "@/lib/domain/evaluation/log-loss";
import { selfMarkPrediction } from "@/lib/domain/evaluation/self-mark";

export type ReviewedFixtureItem = {
  fixtureId: string;
  kickoffAt: string | null;
  gameweek: number | null;
  homeTeam: { id: string; name: string; shortName: string | null; code: string | null };
  awayTeam: { id: string; name: string; shortName: string | null; code: string | null };
  prediction: {
    predictionId: string;
    modelVersion: string | null;
    verdict: string | null;
    confidence: string | null;
    rationale: string | null;
    homeProb: number | null;
    drawProb: number | null;
    awayProb: number | null;
  };
  evaluation: {
    actualHomeGoals: number;
    actualAwayGoals: number;
    actualResult: string;
    correct1x2: boolean;
    selfMark: number;
    exactScoreHit: boolean;
    brierScore: number | null;
    logLoss: number | null;
    evaluatedAt: string;
  };
};

export async function evaluatePredictionForFixture(params: {
  fixtureId: string;
  actualHomeGoals: number;
  actualAwayGoals: number;
}): Promise<void> {
  if (!hasDbEnv) return;

  const { fixtureId, actualHomeGoals, actualAwayGoals } = params;
  const db = getDb();

  const { data: prediction, error: predictionError } = await db
    .from("predictions")
    .select("id, home_prob, draw_prob, away_prob, verdict, confidence")
    .eq("fixture_id", fixtureId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (predictionError) throw new Error(`Could not load prediction for fixture ${fixtureId}: ${predictionError.message}`);
  if (!prediction) return;

  const selfMarked = selfMarkPrediction({
    verdict: prediction.verdict,
    confidence: prediction.confidence,
    actualHomeGoals,
    actualAwayGoals,
  });

  const brierScore = computeBrierScore({
    homeProb: Number(prediction.home_prob),
    drawProb: Number(prediction.draw_prob),
    awayProb: Number(prediction.away_prob),
    actualResult: selfMarked.actualResult,
  });

  const logLoss = computeLogLoss({
    homeProb: Number(prediction.home_prob),
    drawProb: Number(prediction.draw_prob),
    awayProb: Number(prediction.away_prob),
    actualResult: selfMarked.actualResult,
  });

  const { error: upsertError } = await db
    .from("prediction_evaluations")
    .upsert(
      {
        prediction_id: prediction.id,
        fixture_id: fixtureId,
        actual_home_goals: actualHomeGoals,
        actual_away_goals: actualAwayGoals,
        actual_result: selfMarked.actualResult,
        correct_1x2: selfMarked.correct1x2,
        self_mark: selfMarked.selfMark,
        exact_score_hit: selfMarked.exactScoreHit,
        brier_score: brierScore,
        log_loss: logLoss,
      },
      { onConflict: "prediction_id" }
    );

  if (upsertError) throw new Error(`Could not save evaluation for fixture ${fixtureId}: ${upsertError.message}`);
}

export async function listReviewedFixtures(limit = 100): Promise<ReviewedFixtureItem[]> {
  if (!hasDbEnv) return [];

  const db = getDb();

  const { data, error } = await db
    .from("prediction_evaluations")
    .select(`
      fixture_id,
      actual_home_goals,
      actual_away_goals,
      actual_result,
      correct_1x2,
      self_mark,
      exact_score_hit,
      brier_score,
      log_loss,
      evaluated_at,
      prediction:predictions!prediction_evaluations_prediction_id_fkey(
        id,
        verdict,
        confidence,
        rationale,
        home_prob,
        draw_prob,
        away_prob,
        model_version:model_versions(version_key)
      ),
      fixture:fixtures!prediction_evaluations_fixture_id_fkey(
        id,
        kickoff_at,
        gameweek,
        home_team:teams!fixtures_home_team_id_fkey(id,name,short_name,code),
        away_team:teams!fixtures_away_team_id_fkey(id,name,short_name,code)
      )
    `)
    .order("evaluated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Could not list reviewed fixtures: ${error.message}`);

  return (data ?? []).map((row: any) => {
    const fixture = Array.isArray(row.fixture) ? row.fixture[0] : row.fixture;
    const prediction = Array.isArray(row.prediction) ? row.prediction[0] : row.prediction;
    const homeTeam = Array.isArray(fixture?.home_team) ? fixture.home_team[0] : fixture?.home_team;
    const awayTeam = Array.isArray(fixture?.away_team) ? fixture.away_team[0] : fixture?.away_team;
    const modelVersion = Array.isArray(prediction?.model_version)
      ? prediction.model_version[0]
      : prediction?.model_version;

    return {
      fixtureId: row.fixture_id,
      kickoffAt: fixture?.kickoff_at ?? null,
      gameweek: fixture?.gameweek ?? null,
      homeTeam: {
        id: homeTeam?.id,
        name: homeTeam?.name,
        shortName: homeTeam?.short_name ?? null,
        code: homeTeam?.code ?? null,
      },
      awayTeam: {
        id: awayTeam?.id,
        name: awayTeam?.name,
        shortName: awayTeam?.short_name ?? null,
        code: awayTeam?.code ?? null,
      },
      prediction: {
        predictionId: prediction?.id,
        modelVersion: modelVersion?.version_key ?? null,
        verdict: prediction?.verdict ?? null,
        confidence: prediction?.confidence ?? null,
        rationale: prediction?.rationale ?? null,
        homeProb: prediction?.home_prob == null ? null : Number(prediction.home_prob),
        drawProb: prediction?.draw_prob == null ? null : Number(prediction.draw_prob),
        awayProb: prediction?.away_prob == null ? null : Number(prediction.away_prob),
      },
      evaluation: {
        actualHomeGoals: row.actual_home_goals,
        actualAwayGoals: row.actual_away_goals,
        actualResult: row.actual_result,
        correct1x2: row.correct_1x2,
        selfMark: row.self_mark,
        exactScoreHit: row.exact_score_hit,
        brierScore: row.brier_score == null ? null : Number(row.brier_score),
        logLoss: row.log_loss == null ? null : Number(row.log_loss),
        evaluatedAt: row.evaluated_at,
      },
    };
  });
}