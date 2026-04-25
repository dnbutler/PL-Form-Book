export function computeLogLoss(params: { homeProb: number; drawProb: number; awayProb: number; actualResult: "H" | "D" | "A"; }): number {
  const epsilon = 1e-6;
  const probabilities = { H: Math.max(params.homeProb / 100, epsilon), D: Math.max(params.drawProb / 100, epsilon), A: Math.max(params.awayProb / 100, epsilon) };
  return Math.round((-Math.log(probabilities[params.actualResult])) * 10000) / 10000;
}
