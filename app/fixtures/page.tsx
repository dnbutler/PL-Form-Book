import { listFixtures } from "@/lib/db/fixtures";
import { listTeams } from "@/lib/db/teams";
import { getPreferences } from "@/lib/db/preferences";
import { FixturesPageClient } from "@/components/fixtures/fixtures-page-client";

export default async function FixturesPage() {
  const [fixtures, teams, preferences] = await Promise.all([
    listFixtures({ status: "scheduled", limit: 50 }),
    listTeams(),
    getPreferences(),
  ]);
  return <FixturesPageClient fixtures={fixtures} teams={teams.map((t: any) => ({ id: t.id, name: t.name }))} preferences={preferences} />;
}
