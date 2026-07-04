"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import type { Engineer } from "@/core/types";

interface UtilizationChartProps {
  engineers: Engineer[];
}

function getBarColor(utilization: number): string {
  if (utilization >= 100) return "#ef4444";
  if (utilization >= 85) return "#f59e0b";
  if (utilization >= 60) return "#10b981";
  return "#60a5fa";
}

export function UtilizationChart({ engineers }: UtilizationChartProps) {
  const data = [...engineers]
    .sort((a, b) => b.utilization - a.utilization)
    .map((e) => ({
      name: e.name.split(" ")[0],
      utilization: e.utilization,
      fill: getBarColor(e.utilization),
    }));

  return (
    <div className="card p-6">
      <h3 className="section-title mb-1">Team Utilization</h3>
      <p className="mb-6 text-sm text-slate-500">
        Current allocation across the delta engineering team
      </p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 120]}
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
              }}
              formatter={(value: number) => [`${value}%`, "Utilization"]}
            />
            <ReferenceLine x={100} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "100%", position: "top", fill: "#ef4444", fontSize: 11 }} />
            <Bar dataKey="utilization" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
