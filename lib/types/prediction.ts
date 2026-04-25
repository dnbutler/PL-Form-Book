import type { FactorKey } from "./model";

export interface FactorScoreBreakdown {
  factorKey: FactorKey;
  factorName: string;
  score: number;
  weight: number;
  weightedContribution: number;
}

export interface TeamScoringBreakdown {
  total: number;
  factors: FactorScoreBreakdown[];
}

export interface ProbabilityOutput {
  homeProb: number;
  drawProb: number;
  awayProb: number;
}

export type ConfidenceBand = "Low" | "Medium" | "High";

export interface PredictionOutput {
  home: TeamScoringBreakdown;
  away: TeamScoringBreakdown;
  edge: number;
  probabilities: ProbabilityOutput;
  verdict: string;
  confidence: ConfidenceBand;
  rationale: string;
}
