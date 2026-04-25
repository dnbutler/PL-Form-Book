import { listFixtures } from "@/lib/db/fixtures";
import { ResultsPageClient } from "@/components/results/results-page-client";

export default async function ResultsPage() {
  const fixtures = await listFixtures({ status: "completed", limit: 100 });
  return <ResultsPageClient fixtures={fixtures} />;
}
