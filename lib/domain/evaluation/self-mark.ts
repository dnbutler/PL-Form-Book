export function resultFromScore(homeGoals: number, awayGoals: number): "H" | "D" | "A" {
  if (homeGoals > awayGoals) return "H";
  if (homeGoals < awayGoals) return "A";
  return "D";
}

export function selfMarkPrediction(params: { verdict: string; confidence: "Low" | "Medium" | "High"; actualHomeGoals: number; actualAwayGoals: number; }): { actualResult: "H" | "D" | "A"; correct1x2: boolean; selfMark: 0 | 1 | 2; exactScoreHit: boolean } {
  const { verdict, confidence, actualHomeGoals, actualAwayGoals } = params;
  const actualResult = resultFromScore(actualHomeGoals, actualAwayGoals);
  const predictedBucket = verdictToBucket(verdict);
  const correct1x2 = predictedBucket === actualResult;
  if (correct1x2) return { actualResult, correct1x2: true, selfMark: 2, exactScoreHit: false };
  const goalMargin = Math.abs(actualHomeGoals - actualAwayGoals);
  const nearMiss = predictedBucket === "D" || actualResult === "D" || (confidence === "Low" && goalMargin === 1);
  return { actualResult, correct1x2: false, selfMark: nearMiss ? 1 : 0, exactScoreHit: false };
}

function verdictToBucket(verdict: string): "H" | "D" | "A" {
  const value = verdict.toLowerCase();
  if (value.includes("draw")) return "D";
  if (value.includes("away")) return "A";
  return "H";
}
