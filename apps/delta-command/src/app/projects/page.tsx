import { ProjectsPageClient } from "@/components/projects/ProjectsPageClient";
import { getEngineers, getProjects } from "@/core/api";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const [projects, engineers] = await Promise.all([getProjects(), getEngineers()]);
  return <ProjectsPageClient initialProjects={projects} engineers={engineers} />;
}
