import { NextRequest, NextResponse } from "next/server";
import { getDb, hasDbEnv } from "@/lib/db/client";
import { evaluatePredictionForFixture } from "@/lib/db/evaluations";

interface ResultIngestRow { fixtureId: string; actualHomeGoals: number; actualAwayGoals: number; status?: "completed"; }
interface ResultIngestRequest { results: ResultIngestRow[]; }

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ResultIngestRequest;
    if (!body.results || !Array.isArray(body.results) || body.results.length === 0) return NextResponse.json({ error: "results is required" }, { status: 400 });
    if (!hasDbEnv) return NextResponse.json({ updatedFixtures: body.results.length, evaluatedPredictions: body.results.length, mode: "demo" });
    let updatedFixtures = 0;
    let evaluatedPredictions = 0;
    const db = getDb();
    for (const row of body.results) {
      const { error: updateError } = await db.from("fixtures").update({ actual_home_goals: row.actualHomeGoals, actual_away_goals: row.actualAwayGoals, status: row.status ?? "completed" }).eq("id", row.fixtureId);
      if (updateError) throw new Error(`Could not update fixture ${row.fixtureId}`);
      updatedFixtures += 1;
      await evaluatePredictionForFixture({ fixtureId: row.fixtureId, actualHomeGoals: row.actualHomeGoals, actualAwayGoals: row.actualAwayGoals });
      evaluatedPredictions += 1;
    }
    return NextResponse.json({ updatedFixtures, evaluatedPredictions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not ingest results" }, { status: 500 });
  }
}
