export function computeBrierScore(params: { homeProb: number; drawProb: number; awayProb: number; actualResult: "H" | "D" | "A"; }): number {
  const home = params.homeProb / 100;
  const draw = params.drawProb / 100;
  const away = params.awayProb / 100;
  const actual = { H: { home: 1, draw: 0, away: 0 }, D: { home: 0, draw: 1, away: 0 }, A: { home: 0, draw: 0, away: 1 } }[params.actualResult];
  const score = (home - actual.home) ** 2 + (draw - actual.draw) ** 2 + (away - actual.away) ** 2;
  return Math.round(score * 10000) / 10000;
}
