export interface EvaluationOutput {
  actualHomeGoals: number;
  actualAwayGoals: number;
  actualResult: "H" | "D" | "A";
  correct1x2: boolean;
  selfMark: 0 | 1 | 2;
  exactScoreHit: boolean;
  brierScore: number;
  logLoss: number;
}
