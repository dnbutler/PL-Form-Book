import { NextResponse } from "next/server";
import { getFixtureDetail } from "@/lib/db/fixtures";

export async function GET(_: Request, context: { params: Promise<{ fixtureId: string }> }) {
  try {
    const { fixtureId } = await context.params;
    const detail = await getFixtureDetail(fixtureId);
    return NextResponse.json(detail);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not load fixture detail" }, { status: 500 });
  }
}
