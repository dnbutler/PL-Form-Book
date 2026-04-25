import type { ConfidenceBand } from "@/lib/types/prediction";
import type { RawFactorScores } from "./factor-scores";

export function chooseConfidence(params: { edge: number; homeProb: number; drawProb: number; awayProb: number; homeScores: RawFactorScores; awayScores: RawFactorScores; }): ConfidenceBand {
  const { edge, homeProb, drawProb, awayProb, homeScores, awayScores } = params;
  const topProb = Math.max(homeProb, drawProb, awayProb);
  const alignment = ["form", "venue", "attack", "defence", "league", "availability"].reduce((count, key) => count + ((homeScores as any)[key] > (awayScores as any)[key] ? 1 : 0), 0);
  if (Math.abs(edge) >= 1.4 && topProb >= 56 && alignment >= 4) return "High";
  if (Math.abs(edge) >= 0.7 && topProb >= 46 && alignment >= 3) return "Medium";
  return "Low";
}
