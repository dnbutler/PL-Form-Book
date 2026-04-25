import { getFixtureDetail } from "@/lib/db/fixtures";
import { FixtureDetailPage } from "@/components/fixtures/fixture-detail-page";

export default async function FixtureDetailRoute({ params }: { params: Promise<{ fixtureId: string }> }) {
  const { fixtureId } = await params;
  const detail = await getFixtureDetail(fixtureId);
  return <FixtureDetailPage detail={detail} />;
}
