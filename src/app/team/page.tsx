import { getState } from "@/core/api";
import { TeamPageClient } from "@/components/team/TeamPageClient";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const { engineers, projects } = await getState();
  return <TeamPageClient engineers={engineers} projects={projects} />;
}
