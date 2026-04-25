export function probabilityMap(edge: number) {
  const drawProb = clamp(0.27 - Math.abs(edge) * 0.03, 0.18, 0.32);
  const remaining = 1 - drawProb;
  const homeShare = clamp(0.5 + edge * 0.11, 0.15, 0.85);
  return roundToWholePercentages(remaining * homeShare, drawProb, remaining * (1 - homeShare));
}
function roundToWholePercentages(home: number, draw: number, away: number) {
  let homePct = Math.round(home * 100);
  let drawPct = Math.round(draw * 100);
  let awayPct = Math.round(away * 100);
  const total = homePct + drawPct + awayPct;
  if (total !== 100) {
    const diff = 100 - total;
    if (homePct >= drawPct && homePct >= awayPct) homePct += diff;
    else if (drawPct >= homePct && drawPct >= awayPct) drawPct += diff;
    else awayPct += diff;
  }
  return { homeProb: homePct, drawProb: drawPct, awayProb: awayPct };
}
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
