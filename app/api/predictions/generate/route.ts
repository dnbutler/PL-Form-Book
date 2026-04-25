import { NextRequest, NextResponse } from "next/server";
import { getActiveModelVersion, getFixtureH2H, getFixtureInputs } from "@/lib/db/queries";
import { getFixtureDetail } from "@/lib/db/fixtures";
import { savePrediction } from "@/lib/db/predictions";
import { scoreFixture } from "@/lib/domain/scoring/score-fixture";

interface GeneratePredictionsRequest { fixtureIds: string[]; }

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GeneratePredictionsRequest;
    if (!body.fixtureIds || !Array.isArray(body.fixtureIds) || body.fixtureIds.length === 0) return NextResponse.json({ error: "fixtureIds is required" }, { status: 400 });
    const modelVersion = await getActiveModelVersion();
    const outputs = [];
    for (const fixtureId of body.fixtureIds) {
      const { home, away } = await getFixtureInputs(fixtureId);
      const h2hRows = await getFixtureH2H(fixtureId);
      const detail = await getFixtureDetail(fixtureId);
      const homeTeam = Array.isArray(detail.fixture.home_team) ? detail.fixture.home_team[0] : detail.fixture.home_team;
      const awayTeam = Array.isArray(detail.fixture.away_team) ? detail.fixture.away_team[0] : detail.fixture.away_team;
      const scored = scoreFixture({ home, away, h2hRows, modelVersion, homeTeamName: homeTeam.name, awayTeamName: awayTeam.name });
      const predictionId = await savePrediction({ fixtureId, modelVersion, homeTeamId: home.teamId, awayTeamId: away.teamId, output: scored });
      outputs.push({ fixtureId, predictionId, prediction: scored });
    }
    return NextResponse.json({ modelVersion: modelVersion.versionKey, generated: outputs.length, outputs });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Prediction generation failed" }, { status: 500 });
  }
}
