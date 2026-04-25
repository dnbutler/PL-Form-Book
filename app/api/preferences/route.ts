import { NextRequest, NextResponse } from "next/server";
import { getPreferences, updatePreferences } from "@/lib/db/preferences";

export async function GET() {
  try { return NextResponse.json(await getPreferences()); }
  catch (error) { console.error(error); return NextResponse.json({ error: "Could not load preferences" }, { status: 500 }); }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = await updatePreferences({ focusTeamId: body.focusTeamId ?? null, highlightFocusFixtures: Boolean(body.highlightFocusFixtures) });
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update preferences" }, { status: 500 });
  }
}
