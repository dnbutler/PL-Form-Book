import { NextRequest, NextResponse } from "next/server";
import { requireAdminRunToken } from "@/lib/server/admin-auth";
import { getDb } from "@/lib/db/client";
import { buildTeamMatchInputsForFixture } from "@/lib/domain/inputs/build-team-match-inputs";
import { getActiveModelVersion, getFixtureH2H, getFixtureInputs } from "@/lib/db/queries";
import { getFixtureDetail } from "@/lib/db/fixtures";
import { savePrediction } from "@/lib/db/predictions";
import { scoreFixture } from "@/lib/domain/scoring/score-fixture";

export async function POST(request: NextRequest) {
  const unauthorized = requireAdminRunToken(request);
  if (unauthorized) return unauthorized;

  try {
    const db = getDb();

    const { data: fixtures, error: fixturesError } = await db
      .from("fixtures")
      .select("id")
      .eq("status", "scheduled")
      .order("kickoff_at", { ascending: true });

    if (fixturesError) {
      throw new Error(`Could not load scheduled fixtures: ${fixturesError.message}`);
    }

    const fixtureIds = (fixtures ?? []).map((f) => f.id as string);

    if (fixtureIds.length === 0) {
      return NextResponse.json({
        scheduledFixtures: 0,
        builtInputs: 0,
        generatedPredictions: 0,
        outputs: [],
      });
    }

    const modelVersion = await getActiveModelVersion();
    const outputs = [];

    for (const fixtureId of fixtureIds) {
      const inputBuild = await buildTeamMatchInputsForFixture(fixtureId);

      const { home, away } = await getFixtureInputs(fixtureId);
      const h2hRows = await getFixtureH2H(fixtureId);
      const detail = await getFixtureDetail(fixtureId);

      const homeTeam = Array.isArray(detail.fixture.home_team)
        ? detail.fixture.home_team[0]
        : detail.fixture.home_team;

      const awayTeam = Array.isArray(detail.fixture.away_team)
        ? detail.fixture.away_team[0]
        : detail.fixture.away_team;

      const scored = scoreFixture({
        home,
        away,
        h2hRows,
        modelVersion,
        homeTeamName: homeTeam.name,
        awayTeamName: awayTeam.name,
      });

      const predictionId = await savePrediction({
        fixtureId,
        modelVersion,
        homeTeamId: home.teamId,
        awayTeamId: away.teamId,
        output: scored,
      });

      outputs.push({
        fixtureId,
        builtInputs: inputBuild.createdInputs,
        predictionId,
        verdict: scored.verdict,
        confidence: scored.confidence,
      });
    }

    return NextResponse.json({
      scheduledFixtures: fixtureIds.length,
      builtInputs: outputs.reduce((sum, row) => sum + row.builtInputs, 0),
      generatedPredictions: outputs.length,
      outputs,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not run scheduled slate" }, { status: 500 });
  }
}