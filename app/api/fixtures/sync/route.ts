import { NextRequest, NextResponse } from "next/server";
import { requireAdminRunToken } from "@/lib/server/admin-auth";
import { getDb } from "@/lib/db/client";

const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";
const COMPETITION_CODE = "PL";

type FootballDataTeam = {
  id: number;
  name: string;
  shortName?: string | null;
  tla?: string | null;
  crest?: string | null;
};

type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  homeTeam: FootballDataTeam;
  awayTeam: FootballDataTeam;
  score?: {
    fullTime?: {
      home: number | null;
      away: number | null;
    };
  };
};

function mapStatus(status: string) {
  if (status === "FINISHED") return "completed";
  if (status === "SCHEDULED" || status === "TIMED") return "scheduled";
  if (status === "IN_PLAY" || status === "PAUSED" || status === "LIVE") return "live";
  return "scheduled";
}

async function upsertTeam(team: FootballDataTeam) {
  const db = getDb();

  const externalId = String(team.id);
  const code = team.tla ?? externalId;
  const shortName = team.shortName ?? team.tla ?? team.name;
  const crestUrl = team.crest ?? null;

  const { data: existingByExternalId, error: externalLookupError } = await db
    .from("teams")
    .select("id")
    .eq("external_id", externalId)
    .maybeSingle();

  if (externalLookupError) {
    throw new Error(
      `Could not look up team ${team.name} by external_id: ${externalLookupError.message}`
    );
  }

  if (existingByExternalId?.id) {
    const { data, error } = await db
      .from("teams")
      .update({
        name: team.name,
        short_name: shortName,
        code,
        crest_url: crestUrl,
      })
      .eq("id", existingByExternalId.id)
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(`Could not update team ${team.name}: ${error?.message ?? "No row returned"}`);
    }

    return data.id as string;
  }

  const { data: existingByCode, error: codeLookupError } = await db
    .from("teams")
    .select("id")
    .eq("code", code)
    .maybeSingle();

  if (codeLookupError) {
    throw new Error(`Could not look up team ${team.name} by code: ${codeLookupError.message}`);
  }

  if (existingByCode?.id) {
    const { data, error } = await db
      .from("teams")
      .update({
        external_id: externalId,
        name: team.name,
        short_name: shortName,
        crest_url: crestUrl,
      })
      .eq("id", existingByCode.id)
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(`Could not update team ${team.name}: ${error?.message ?? "No row returned"}`);
    }

    return data.id as string;
  }

  const { data, error } = await db
    .from("teams")
    .insert({
      external_id: externalId,
      name: team.name,
      short_name: shortName,
      code,
      crest_url: crestUrl,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Could not insert team ${team.name}: ${error?.message ?? "No row returned"}`);
  }

  return data.id as string;
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

    const today = new Date();
    const dateFrom = today.toISOString().slice(0, 10);

    const dateToDate = new Date(today);
    dateToDate.setDate(dateToDate.getDate() + 21);
    const dateTo = dateToDate.toISOString().slice(0, 10);

    const url = `${FOOTBALL_DATA_BASE_URL}/competitions/${COMPETITION_CODE}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;

    const response = await fetch(url, {
      headers: {
        "X-Auth-Token": token,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`football-data request failed ${response.status}: ${text}`);
    }

    const payload = await response.json();
    const matches = (payload.matches ?? []) as FootballDataMatch[];

    const db = getDb();
    const outputs = [];

    for (const match of matches) {
      const homeTeamId = await upsertTeam(match.homeTeam);
      const awayTeamId = await upsertTeam(match.awayTeam);

      const status = mapStatus(match.status);
      const actualHomeGoals = match.score?.fullTime?.home ?? null;
      const actualAwayGoals = match.score?.fullTime?.away ?? null;

      const { data: fixture, error: fixtureError } = await db
        .from("fixtures")
        .upsert(
          {
            external_id: String(match.id),
            kickoff_at: match.utcDate,
            gameweek: match.matchday,
            status,
            home_team_id: homeTeamId,
            away_team_id: awayTeamId,
            actual_home_goals: actualHomeGoals,
            actual_away_goals: actualAwayGoals,
          },
          { onConflict: "external_id" }
        )
        .select("id")
        .single();

      if (fixtureError || !fixture) {
        throw new Error(
          `Could not upsert fixture ${match.id}: ${fixtureError?.message ?? "No row returned"}`
        );
      }

      outputs.push({
        externalMatchId: match.id,
        fixtureId: fixture.id,
        status,
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        kickoffAt: match.utcDate,
        gameweek: match.matchday,
      });
    }

    return NextResponse.json({
      source: "football-data.org",
      competition: COMPETITION_CODE,
      dateFrom,
      dateTo,
      syncedFixtures: outputs.length,
      outputs,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not sync fixtures" }, { status: 500 });
  }
}