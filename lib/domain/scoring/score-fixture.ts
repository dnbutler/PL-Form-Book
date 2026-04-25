import type { TeamMatchInput, H2HContextRow } from "@/lib/types/inputs";
import type { ModelVersion } from "@/lib/types/model";
import type { PredictionOutput } from "@/lib/types/prediction";
import { buildFactorScores, factorLabels } from "./factor-scores";
import { probabilityMap } from "./probability-map";
import { chooseConfidence } from "./confidence";
import { buildRationale } from "./rationale";

export function scoreFixture(params: { home: TeamMatchInput; away: TeamMatchInput; h2hRows: H2HContextRow[]; modelVersion: ModelVersion; homeTeamName: string; awayTeamName: string; }): PredictionOutput {
  const { home, away, h2hRows, modelVersion, homeTeamName, awayTeamName } = params;
  const homeScores = buildFactorScores({ team: home, h2hRows, side: "home" });
  const awayScores = buildFactorScores({ team: away, h2hRows, side: "away" });
  const weightMap = new Map(modelVersion.factorWeights.map((w) => [w.factorKey, w.weightPct / 100]));
  const homeFactors = Object.entries(homeScores).map(([factorKey, score]) => ({ factorKey, factorName: factorLabels[factorKey as keyof typeof factorLabels], score, weight: weightMap.get(factorKey as any) ?? 0, weightedContribution: round4(score * (weightMap.get(factorKey as any) ?? 0)) }));
  const awayFactors = Object.entries(awayScores).map(([factorKey, score]) => ({ factorKey, factorName: factorLabels[factorKey as keyof typeof factorLabels], score, weight: weightMap.get(factorKey as any) ?? 0, weightedContribution: round4(score * (weightMap.get(factorKey as any) ?? 0)) }));
  const homeTotal = round4(homeFactors.reduce((sum, x) => sum + x.weightedContribution, 0));
  const awayTotal = round4(awayFactors.reduce((sum, x) => sum + x.weightedContribution, 0));
  const edge = round4(homeTotal - awayTotal);
  const probabilities = probabilityMap(edge);
  const verdict = chooseVerdict(probabilities);
  const confidence = chooseConfidence({ edge, ...probabilities, homeScores, awayScores });
  const rationale = buildRationale({ homeTeamName, awayTeamName, homeScores, awayScores, verdict });
  return { home: { total: homeTotal, factors: homeFactors as any }, away: { total: awayTotal, factors: awayFactors as any }, edge, probabilities, verdict, confidence, rationale };
}
function chooseVerdict(p: { homeProb: number; drawProb: number; awayProb: number }) {
  const top = Math.max(p.homeProb, p.drawProb, p.awayProb);
  if (p.drawProb === top) return top < 50 ? "Draw lean" : "Draw";
  if (p.awayProb === top) return top < 50 ? "Away win lean" : "Away win";
  return top < 50 ? "Home win lean" : "Home win";
}
function round4(v: number) { return Math.round(v * 10000) / 10000; }
