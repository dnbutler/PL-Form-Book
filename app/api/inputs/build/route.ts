import { NextRequest, NextResponse } from "next/server";
import { buildTeamMatchInputsForFixture } from "@/lib/domain/inputs/build-team-match-inputs";

interface BuildInputsRequest {
  fixtureIds: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BuildInputsRequest;

    if (!body.fixtureIds || !Array.isArray(body.fixtureIds) || body.fixtureIds.length === 0) {
      return NextResponse.json({ error: "fixtureIds is required" }, { status: 400 });
    }

    const outputs = [];

    for (const fixtureId of body.fixtureIds) {
      const result = await buildTeamMatchInputsForFixture(fixtureId);
      outputs.push(result);
    }

    return NextResponse.json({
      processed: outputs.length,
      createdInputs: outputs.reduce((sum, row) => sum + row.createdInputs, 0),
      outputs,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not build team_match_inputs" }, { status: 500 });
  }
}