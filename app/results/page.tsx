import { listReviewedFixtures } from "@/lib/db/evaluations";
import { ResultsPageClient } from "@/components/results/results-page-client";

export default async function ResultsPage() {
  const fixtures = await listReviewedFixtures(100);
  return <ResultsPageClient fixtures={fixtures} />;
}