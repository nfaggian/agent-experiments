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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                <Users className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {engineers.length}
                </p>
                <p className="text-sm text-slate-500">Team Members</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{avgUtil}%</p>
                <p className="text-sm text-slate-500">Avg Utilization</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {available.length}
                </p>
                <p className="text-sm text-slate-500">Available Capacity</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {overallocated.length}
                </p>
                <p className="text-sm text-slate-500">Overallocated</p>
              </div>
            </div>
          </div>
        </div>

        {overallocated.length > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">
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
                <span className="w-32 truncate text-sm font-medium text-slate-700">
                  {engineer.name.split(" ")[0]}
                </span>
                <div className="relative flex-1">
                  <div className="h-6 overflow-hidden rounded-md bg-slate-100">
                    <div
                      className={cn(
                        "flex h-full items-center justify-end rounded-md pr-2 text-xs font-bold text-white transition-all",
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
                      className="absolute right-0 top-0 h-6 rounded-r-md bg-red-600/80"
                      style={{
                        width: `${Math.min(engineer.utilization - 100, 20)}%`,
                      }}
                    />
                  )}
                </div>
                <span className="w-20 text-right text-xs text-slate-500">
                  {engineer.currentProjects.length} project
                  {engineer.currentProjects.length !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-400" /> Under 60%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> 60–85%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> 85–100%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Over 100%
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
