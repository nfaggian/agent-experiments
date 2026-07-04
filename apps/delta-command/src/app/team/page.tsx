import { getEngineers, getProjects, getUtilizationTimeline } from "@/core/api";
import { TeamPageClient } from "@/components/team/TeamPageClient";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const [engineers, projects, timeline] = await Promise.all([
    getEngineers(),
    getProjects(),
    getUtilizationTimeline(),
  ]);

  return (
    <TeamPageClient
      engineers={engineers}
      projects={projects}
      timeline={timeline}
    />
  );
}
