import { OpportunitiesPageClient } from "@/components/opportunities/OpportunitiesPageClient";
import { getOpportunities } from "@/core/api";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const opportunities = await getOpportunities();
  return <OpportunitiesPageClient initialOpportunities={opportunities} />;
}
