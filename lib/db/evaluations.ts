import { getDb, hasDbEnv } from "./client";
import { computeBrierScore } from "@/lib/domain/evaluation/brier-score";
import { computeLogLoss } from "@/lib/domain/evaluation/log-loss";
import { selfMarkPrediction } from "@/lib/domain/evaluation/self-mark";

export async function evaluatePredictionForFixture(params: { fixtureId: string; actualHomeGoals: number; actualAwayGoals: number; }): Promise<void> {
  if (!hasDbEnv) return;
  const { fixtureId, actualHomeGoals, actualAwayGoals } = params;
  const db = getDb();
  const { data: prediction, error: predictionError } = await db.from("predictions").select("id, home_prob, draw_prob, away_prob, verdict, confidence").eq("fixture_id", fixtureId).order("generated_at", { ascending: false }).limit(1).maybeSingle();
  if (predictionError) throw new Error(`Could not load prediction for fixture ${fixtureId}`);
  if (!prediction) return;
  const selfMarked = selfMarkPrediction({ verdict: prediction.verdict, confidence: prediction.confidence, actualHomeGoals, actualAwayGoals });
  const brierScore = computeBrierScore({ homeProb: Number(prediction.home_prob), drawProb: Number(prediction.draw_prob), awayProb: Number(prediction.away_prob), actualResult: selfMarked.actualResult });
  const logLoss = computeLogLoss({ homeProb: Number(prediction.home_prob), drawProb: Number(prediction.draw_prob), awayProb: Number(prediction.away_prob), actualResult: selfMarked.actualResult });
  const { error: upsertError } = await db.from("prediction_evaluations").upsert({ prediction_id: prediction.id, fixture_id: fixtureId, actual_home_goals: actualHomeGoals, actual_away_goals: actualAwayGoals, actual_result: selfMarked.actualResult, correct_1x2: selfMarked.correct1x2, self_mark: selfMarked.selfMark, exact_score_hit: selfMarked.exactScoreHit, brier_score: brierScore, log_loss: logLoss }, { onConflict: "prediction_id" });
  if (upsertError) throw new Error(`Could not save evaluation for fixture ${fixtureId}`);
}
