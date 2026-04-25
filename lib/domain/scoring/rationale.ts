import type { RawFactorScores } from "./factor-scores";

export function buildRationale(params: { homeTeamName: string; awayTeamName: string; homeScores: RawFactorScores; awayScores: RawFactorScores; verdict: string; }) {
  const { homeTeamName, awayTeamName, homeScores, awayScores, verdict } = params;
  const deltas = [
    { label: "recent form", delta: homeScores.form - awayScores.form },
    { label: "venue strength", delta: homeScores.venue - awayScores.venue },
    { label: "attack trend", delta: homeScores.attack - awayScores.attack },
    { label: "defensive profile", delta: homeScores.defence - awayScores.defence },
    { label: "season strength", delta: homeScores.league - awayScores.league },
    { label: "availability", delta: homeScores.availability - awayScores.availability },
  ].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  if (verdict.toLowerCase().includes("draw")) return "Both sides rate closely on the main V1 signals, with only narrow separation across the strongest factors. Draw risk remains live.";
  const favouredTeam = deltas[0].delta >= 0 ? homeTeamName : awayTeamName;
  const underdog = favouredTeam === homeTeamName ? awayTeamName : homeTeamName;
  return `${favouredTeam} rate stronger on ${deltas[0].label} and ${deltas[1].label}, while ${underdog} do not make up enough ground elsewhere.`;
}
