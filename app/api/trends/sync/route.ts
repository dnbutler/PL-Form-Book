import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { requireAdminRunToken } from "@/lib/server/admin-auth";

const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";
const COMPETITION_CODE = "PL";
const DEFAULT_WINDOW = 5;
const MAX_RANGE_DAYS = 5;

type TrendSide = "home" | "away";

type TrendTeam = {
  id: number;
  name: string;
};

type TrendMetrics = {
  team_id: number;
  avg_goals?: number | null;
  avg_goals_scored?: number | null;
  avg_goals_conceded?: number | null;
  avg_points?: number | null;
  pct_wins?: number | null;
  pct_draws?: number | null;
  pct_losses?: number | null;
  pct_bts?: number | null;
  pct_fts?: number | null;
  pct_o_15?: number | null;
  pct_o_25?: number | null;
  pct_o_35?: number | null;
  pct_u_15?: number | null;
  pct_u_25?: number | null;
  pct_u_35?: number | null;
  pct_1st_hf_o_05?: number | null;
  pct_1st_hf_o_15?: number | null;
  pct_2nd_hf_o_05?: number | null;
  pct_2nd_hf_o_15?: number | null;
  form?: string | null;
  match_ids?: number[] | null;
  competitions?: string | null;
  window_start_date?: string | null;
  window_end_date?: string | null;
};

type FootballDataTrend = {
  id: number;
  status: string;
  matchday: number | null;
  utcDate: string;
  homeTeam: TrendTeam;
  awayTeam: TrendTeam;
  trend: {
    home: TrendMetrics;
    away: TrendMetrics;
  };
};

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function normaliseDateRange(request: NextRequest) {
  const url = new URL(request.url);
  const dateFromParam = url.searchParams.get("dateFrom");
  const dateToParam = url.searchParams.get("dateTo");

  const today = new Date();
  const dateFrom = dateFromParam ?? toDateString(today);
  const requestedDateTo = dateToParam ?? toDateString(addDays(today, MAX_RANGE_DAYS));

  const from = new Date(`${dateFrom}T00:00:00Z`);
  const to = new Date(`${requestedDateTo}T00:00:00Z`);
  const maxTo = addDays(from, MAX_RANGE_DAYS);

  if (to > maxTo) {
    return {
      dateFrom,
      dateTo: toDateString(maxTo),
      truncated: true,
    };
  }

  return {
    dateFrom,
    dateTo: requestedDateTo,
    truncated: false,
  };
}

function trendRow({
  fixtureId,
  teamId,
  externalMatchId,
  externalTeamId,
  side,
  trendWindow,
  considerSide,
  trend,
}: {
  fixtureId: string;
  teamId: string;
  externalMatchId: string;
  externalTeamId: string;
  side: TrendSide;
  trendWindow: number;
  considerSide: boolean;
  trend: TrendMetrics;
}) {
  return {
    fixture_id: fixtureId,
    team_id: teamId,
    external_match_id: externalMatchId,
    external_team_id: externalTeamId,
    side,
    trend_window: trendWindow,
    consider_side: considerSide,

    avg_goals: trend.avg_goals ?? null,
    avg_goals_scored: trend.avg_goals_scored ?? null,
    avg_goals_conceded: trend.avg_goals_conceded ?? null,
    avg_points: trend.avg_points ?? null,

    pct_wins: trend.pct_wins ?? null,
    pct_draws: trend.pct_draws ?? null,
    pct_losses: trend.pct_losses ?? null,
    pct_bts: trend.pct_bts ?? null,
    pct_fts: trend.pct_fts ?? null,

    pct_o_15: trend.pct_o_15 ?? null,
    pct_o_25: trend.pct_o_25 ?? null,
    pct_o_35: trend.pct_o_35 ?? null,
    pct_u_15: trend.pct_u_15 ?? null,
    pct_u_25: trend.pct_u_25 ?? null,
    pct_u_35: trend.pct_u_35 ?? null,

    pct_1st_hf_o_05: trend.pct_1st_hf_o_05 ?? null,
    pct_1st_hf_o_15: trend.pct_1st_hf_o_15 ?? null,
    pct_2nd_hf_o_05: trend.pct_2nd_hf_o_05 ?? null,
    pct_2nd_hf_o_15: trend.pct_2nd_hf_o_15 ?? null,

    form: trend.form ?? null,
    match_ids: trend.match_ids ?? null,
    competitions: trend.competitions ?? null,
    window_start_date: trend.window_start_date ?? null,
    window_end_date: trend.window_end_date ?? null,

    raw: trend,
    synced_at: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  const unauthorized = requireAdminRunToken(request);
  if (unauthorized) return unauthorized;

  try {
    const token = process.env.FOOTBALL_DATA_API_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "FOOTBALL_DATA_API_TOKEN is not configured" },
        { status: 500 }
      );
    }

    const { dateFrom, dateTo, truncated } = normaliseDateRange(request);
    const url = `${FOOTBALL_DATA_BASE_URL}/trends/?dateFrom=${dateFrom}&dateTo=${dateTo}&competitions=${COMPETITION_CODE}&window=${DEFAULT_WINDOW}&consider_side`;

    const response = await fetch(url, {
      headers: {
        "X-Auth-Token": token,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`football-data trends request failed ${response.status}: ${text}`);
    }

    const payload = await response.json();
    const trends = (payload.trends ?? []) as FootballDataTrend[];

    const db = getDb();
    const outputs = [];
    let upsertedTrendRows = 0;
    let skippedMatches = 0;

    for (const trendMatch of trends) {
      const externalMatchId = String(trendMatch.id);
      const homeExternalTeamId = String(trendMatch.homeTeam.id);
      const awayExternalTeamId = String(trendMatch.awayTeam.id);

      const { data: fixture, error: fixtureError } = await db
        .from("fixtures")
        .select("id")
        .eq("external_id", externalMatchId)
        .maybeSingle();

      if (fixtureError) {
        throw new Error(`Could not look up fixture ${externalMatchId}: ${fixtureError.message}`);
      }

      const { data: teams, error: teamsError } = await db
        .from("teams")
        .select("id, external_id")
        .in("external_id", [homeExternalTeamId, awayExternalTeamId]);

      if (teamsError) {
        throw new Error(`Could not look up teams for fixture ${externalMatchId}: ${teamsError.message}`);
      }

      const homeTeam = (teams ?? []).find((team) => team.external_id === homeExternalTeamId);
      const awayTeam = (teams ?? []).find((team) => team.external_id === awayExternalTeamId);

      if (!fixture?.id || !homeTeam?.id || !awayTeam?.id) {
        skippedMatches += 1;
        outputs.push({
          externalMatchId,
          status: "skipped",
          reason: "Fixture or synced teams not found locally",
        });
        continue;
      }

      const rows = [
        trendRow({
          fixtureId: fixture.id,
          teamId: homeTeam.id,
          externalMatchId,
          externalTeamId: homeExternalTeamId,
          side: "home",
          trendWindow: DEFAULT_WINDOW,
          considerSide: true,
          trend: trendMatch.trend.home,
        }),
        trendRow({
          fixtureId: fixture.id,
          teamId: awayTeam.id,
          externalMatchId,
          externalTeamId: awayExternalTeamId,
          side: "away",
          trendWindow: DEFAULT_WINDOW,
          considerSide: true,
          trend: trendMatch.trend.away,
        }),
      ];

      const { error: upsertError } = await db
        .from("fixture_team_trends")
        .upsert(rows, {
          onConflict: "fixture_id,team_id,side,trend_window,consider_side",
        });

      if (upsertError) {
        throw new Error(`Could not upsert trends for fixture ${externalMatchId}: ${upsertError.message}`);
      }

      upsertedTrendRows += rows.length;
      outputs.push({
        externalMatchId,
        fixtureId: fixture.id,
        homeTeam: trendMatch.homeTeam.name,
        awayTeam: trendMatch.awayTeam.name,
        status: "synced",
        rows: rows.length,
      });
    }

    return NextResponse.json({
      source: "football-data.org",
      competition: COMPETITION_CODE,
      dateFrom,
      dateTo,
      truncated,
      trendWindow: DEFAULT_WINDOW,
      considerSide: true,
      returnedMatches: trends.length,
      upsertedTrendRows,
      skippedMatches,
      outputs,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not sync trends" }, { status: 500 });
  }
}
