import { OpportunitiesPageClient } from "@/components/opportunities/OpportunitiesPageClient";
import { getState } from "@/core/api";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const { opportunities } = await getState();
  return <OpportunitiesPageClient initialOpportunities={opportunities} />;
}
