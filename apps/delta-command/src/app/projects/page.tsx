import { ProjectsPageClient } from "@/components/projects/ProjectsPageClient";
import { getState } from "@/core/api";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const { projects, engineers } = await getState();
  return <ProjectsPageClient initialProjects={projects} engineers={engineers} />;
}
