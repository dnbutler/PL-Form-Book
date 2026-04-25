import { NextRequest, NextResponse } from "next/server";
import { listFixtures } from "@/lib/db/fixtures";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const gameweekParam = searchParams.get("gameweek");
    const limitParam = searchParams.get("limit");
    const teamId = searchParams.get("teamId") ?? undefined;
    const fixtures = await listFixtures({ status, gameweek: gameweekParam ? Number(gameweekParam) : undefined, teamId, limit: limitParam ? Number(limitParam) : undefined });
    return NextResponse.json({ fixtures });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not load fixtures" }, { status: 500 });
  }
}
