import { getDb, hasDbEnv } from "./client";
import { demoFixtures } from "./demo";
import type { FixtureListItem } from "@/lib/types/api";

export async function listFixtures(params?: { status?: string; gameweek?: number; teamId?: string; limit?: number; }): Promise<FixtureListItem[]> {
  if (!hasDbEnv) {
    let rows = [...demoFixtures];
    if (params?.status) rows = rows.filter((r) => r.status === params.status);
    if (params?.gameweek != null) rows = rows.filter((r) => r.gameweek === params.gameweek);
    if (params?.teamId) rows = rows.filter((r) => r.homeTeam.id === params.teamId || r.awayTeam.id === params.teamId);
    if (params?.limit != null) rows = rows.slice(0, params.limit);
    return rows;
  }

  const db = getDb();
  const query = db.from("v_fixture_predictions").select(`
      fixture_id, kickoff_at, gameweek, status,
      home_team_id, away_team_id, home_team, home_team_short, home_team_crest_url, away_team, away_team_short, away_team_crest_url,
      prediction_id, version_key, home_prob, draw_prob, away_prob, verdict, confidence, rationale,
      actual_home_goals, actual_away_goals, actual_result, correct_1x2, self_mark
    `).order("kickoff_at", { ascending: true });
  if (params?.status) query.eq("status", params.status);
  if (params?.gameweek != null) query.eq("gameweek", params.gameweek);
  if (params?.limit != null) query.limit(params.limit);
  const { data, error } = await query;
  if (error) throw new Error(`Could not list fixtures: ${error.message}`);
  let rows = (data ?? []).map(mapFixturePredictionRow);
  if (params?.teamId) rows = rows.filter((row) => row.homeTeam.id === params.teamId || row.awayTeam.id === params.teamId);
  return rows;
}

export async function getFixtureDetail(fixtureId: string) {
  if (!hasDbEnv) {
    const fixture = demoFixtures.find((f) => f.fixtureId === fixtureId) ?? demoFixtures[0];
    return {
      fixture: {
        id: fixture.fixtureId,
        kickoff_at: fixture.kickoffAt,
        gameweek: fixture.gameweek,
        status: fixture.status,
        venue_name: null,
        home_team: { id: fixture.homeTeam.id, name: fixture.homeTeam.name, short_name: fixture.homeTeam.shortName, code: fixture.homeTeam.shortName },
        away_team: { id: fixture.awayTeam.id, name: fixture.awayTeam.name, short_name: fixture.awayTeam.shortName, code: fixture.awayTeam.shortName },
      },
      prediction: fixture.prediction ? { id: fixture.prediction.predictionId, home_prob: fixture.prediction.homeProb, draw_prob: fixture.prediction.drawProb, away_prob: fixture.prediction.awayProb, verdict: fixture.prediction.verdict, confidence: fixture.prediction.confidence, rationale: fixture.prediction.rationale, model_version: { version_key: fixture.prediction.modelVersion } } : null,
      factorScores: [
        { team_id: fixture.homeTeam.id, factor_key: "form", factor_name: "Current-season form", factor_score: 7.2, factor_weight: 0.24, weighted_contribution: 1.728 },
        { team_id: fixture.homeTeam.id, factor_key: "venue", factor_name: "Home/away strength", factor_score: 6.8, factor_weight: 0.18, weighted_contribution: 1.224 },
        { team_id: fixture.homeTeam.id, factor_key: "attack", factor_name: "Attack trend", factor_score: 7.0, factor_weight: 0.14, weighted_contribution: 0.98 },
        { team_id: fixture.awayTeam.id, factor_key: "form", factor_name: "Current-season form", factor_score: 5.9, factor_weight: 0.24, weighted_contribution: 1.416 },
        { team_id: fixture.awayTeam.id, factor_key: "venue", factor_name: "Home/away strength", factor_score: 5.1, factor_weight: 0.18, weighted_contribution: 0.918 },
        { team_id: fixture.awayTeam.id, factor_key: "attack", factor_name: "Attack trend", factor_score: 5.8, factor_weight: 0.14, weighted_contribution: 0.812 }
      ]
    };
  }

  const db = getDb();
  const { data: fixture, error: fixtureError } = await db.from("fixtures").select(`id,kickoff_at,gameweek,status,venue_name,home_team:teams!fixtures_home_team_id_fkey(id,name,short_name,code),away_team:teams!fixtures_away_team_id_fkey(id,name,short_name,code)`).eq("id", fixtureId).single();
  if (fixtureError || !fixture) throw new Error(`Could not load fixture ${fixtureId}`);
  const { data: prediction } = await db.from("predictions").select(`id, home_prob, draw_prob, away_prob, verdict, confidence, rationale, model_version:model_versions(version_key)`).eq("fixture_id", fixtureId).order("generated_at", { ascending: false }).limit(1).maybeSingle();
  const { data: factorScores } = await db.from("prediction_factor_scores").select(`prediction_id, team_id, factor_key, factor_name, factor_score, factor_weight, weighted_contribution`).eq("prediction_id", prediction?.id ?? "00000000-0000-0000-0000-000000000000");
  return { fixture, prediction, factorScores: factorScores ?? [] };
}

function mapFixturePredictionRow(row: any): FixtureListItem {
  return {
    fixtureId: row.fixture_id,
    kickoffAt: row.kickoff_at,
    gameweek: row.gameweek,
    status: row.status,
    homeTeam: { id: row.home_team_id, name: row.home_team, shortName: row.home_team_short, crestUrl: row.home_team_crest_url },
    awayTeam: { id: row.away_team_id, name: row.away_team, shortName: row.away_team_short, crestUrl: row.away_team_crest_url },
    prediction: row.prediction_id ? { predictionId: row.prediction_id, modelVersion: row.version_key, homeProb: Number(row.home_prob), drawProb: Number(row.draw_prob), awayProb: Number(row.away_prob), verdict: row.verdict, confidence: row.confidence, rationale: row.rationale } : null,
    evaluation: row.prediction_id ? { actualHomeGoals: row.actual_home_goals, actualAwayGoals: row.actual_away_goals, actualResult: row.actual_result, correct1x2: row.correct_1x2, selfMark: row.self_mark } : null,
  };
}
