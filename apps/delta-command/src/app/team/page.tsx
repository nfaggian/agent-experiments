import { Header } from "@/components/layout/Header";
import { EngineerCard } from "@/components/team/EngineerCard";
import { getEngineers, getProjects } from "@/core/api";
import { cn, getUtilizationColor } from "@/core/utils";
import { Users, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const [engineers, projects] = await Promise.all([getEngineers(), getProjects()]);

  const projectNames = Object.fromEntries(
    projects.map((p) => [p.id, p.name])
  );

  const overallocated = engineers.filter((e) => e.status === "overallocated");
  const available = engineers.filter((e) => e.status === "available");
  const avgUtil = Math.round(
    engineers.reduce((sum, e) => sum + e.utilization, 0) / engineers.length
  );

  const sortedEngineers = [...engineers].sort(
    (a, b) => b.utilization - a.utilization
  );

  return (
    <div>
      <Header
        title="Team Utilization"
        subtitle="Capacity planning and resource allocation across delta engineers"
      />

      <div className="space-y-8 p-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container">
                <Users className="h-5 w-5 text-primary-on-container" />
              </div>
              <div>
                <p className="metric-value text-[1.75rem]">
                  {engineers.length}
                </p>
                <p className="metric-label">Team Members</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-container">
                <Clock className="h-5 w-5 text-tertiary-on-container" />
              </div>
              <div>
                <p className="metric-value text-[1.75rem]">{avgUtil}%</p>
                <p className="metric-label">Avg Utilization</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container">
                <CheckCircle className="h-5 w-5 text-secondary-on-container" />
              </div>
              <div>
                <p className="metric-value text-[1.75rem]">
                  {available.length}
                </p>
                <p className="metric-label">Available Capacity</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error-container">
                <AlertTriangle className="h-5 w-5 text-error-on-container" />
              </div>
              <div>
                <p className="metric-value text-[1.75rem]">
                  {overallocated.length}
                </p>
                <p className="metric-label">Overallocated</p>
              </div>
            </div>
          </div>
        </div>

        {overallocated.length > 0 && (
          <div className="banner-warning">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="body-md">
              <span className="title-sm">
                {overallocated.map((e) => e.name.split(" ")[0]).join(", ")}
              </span>{" "}
              {overallocated.length === 1 ? "is" : "are"} overallocated. Consider
              redistributing workload before taking on new opportunities.
            </p>
          </div>
        )}

        <div className="card p-6">
          <h3 className="section-title mb-4">Capacity Overview</h3>
          <div className="space-y-3">
            {sortedEngineers.map((engineer) => (
              <div key={engineer.id} className="flex items-center gap-4">
                <span className="w-32 truncate title-sm text-surface-on">
                  {engineer.name.split(" ")[0]}
                </span>
                <div className="relative flex-1">
                  <div className="h-6 overflow-hidden rounded-full bg-surface-container-highest">
                    <div
                      className={cn(
                        "flex h-full items-center justify-end rounded-full pr-2 label-md font-medium text-white transition-all",
                        getUtilizationColor(engineer.utilization)
                      )}
                      style={{
                        width: `${Math.min(engineer.utilization, 100)}%`,
                      }}
                    >
                      {engineer.utilization >= 30 && `${engineer.utilization}%`}
                    </div>
                  </div>
                  {engineer.utilization > 100 && (
                    <div
                      className="absolute right-0 top-0 h-6 rounded-r-full bg-error/80"
                      style={{
                        width: `${Math.min(engineer.utilization - 100, 20)}%`,
                      }}
                    />
                  )}
                </div>
                <span className="w-20 text-right label-md text-surface-on-variant">
                  {engineer.currentProjects.length} project
                  {engineer.currentProjects.length !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 label-md text-surface-on-variant/70">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-secondary" /> Under 60%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-primary" /> 60–85%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-tertiary" /> 85–100%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-error" /> Over 100%
            </span>
          </div>
        </div>

        <div>
          <h3 className="section-title mb-4">Team Members</h3>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {sortedEngineers.map((engineer) => (
              <EngineerCard
                key={engineer.id}
                engineer={engineer}
                projectNames={projectNames}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
