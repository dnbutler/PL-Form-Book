import { getDb, hasDbEnv } from "./client";
import type { PredictionOutput } from "@/lib/types/prediction";
import type { ModelVersion } from "@/lib/types/model";

export async function savePrediction(params: { fixtureId: string; modelVersion: ModelVersion; homeTeamId: string; awayTeamId: string; output: PredictionOutput; }): Promise<string> {
  if (!hasDbEnv) return `demo-${params.fixtureId}`;
  const { fixtureId, modelVersion, homeTeamId, awayTeamId, output } = params;
  const db = getDb();
  const { data: prediction, error: predictionError } = await db.from("predictions").upsert({ fixture_id: fixtureId, model_version_id: modelVersion.id, home_total: output.home.total, away_total: output.away.total, edge: output.edge, home_prob: output.probabilities.homeProb, draw_prob: output.probabilities.drawProb, away_prob: output.probabilities.awayProb, verdict: output.verdict, confidence: output.confidence, rationale: output.rationale }, { onConflict: "fixture_id,model_version_id" }).select("id").single();
  if (predictionError || !prediction) throw new Error(`Could not save prediction for fixture ${fixtureId}`);
  const predictionId = prediction.id;
  await db.from("prediction_factor_scores").delete().eq("prediction_id", predictionId);
  const factorRows = [
    ...output.home.factors.map((factor) => ({ prediction_id: predictionId, team_id: homeTeamId, factor_key: factor.factorKey, factor_name: factor.factorName, factor_score: factor.score, factor_weight: factor.weight, weighted_contribution: factor.weightedContribution })),
    ...output.away.factors.map((factor) => ({ prediction_id: predictionId, team_id: awayTeamId, factor_key: factor.factorKey, factor_name: factor.factorName, factor_score: factor.score, factor_weight: factor.weight, weighted_contribution: factor.weightedContribution }))
  ];
  const { error: insertFactorError } = await db.from("prediction_factor_scores").insert(factorRows);
  if (insertFactorError) {
  throw new Error(
    `Could not save factor scores for prediction ${predictionId}: ${insertFactorError.message}`
  );
}
  return predictionId;
}
