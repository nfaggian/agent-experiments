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
  if (utilization >= 100) return "#EF4444";
  if (utilization >= 85) return "#F59E0B";
  if (utilization >= 60) return "#3B82F6";
  return "#10B981";
}

const CHART_GRID = "#E4E4E7";
const CHART_TICK = "#71717A";

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
      <p className="mb-6 body-md text-surface-on-variant">
        Current allocation across the delta engineering team
      </p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 120]}
              tick={{ fontSize: 12, fill: CHART_TICK }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: CHART_TICK }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #E4E4E7",
                boxShadow: "0 8px 24px -4px rgb(0 0 0 / 0.08)",
                fontSize: "13px",
              }}
              formatter={(value: number) => [`${value}%`, "Utilization"]}
            />
            <ReferenceLine x={100} stroke="#EF4444" strokeDasharray="4 4" label={{ value: "100%", position: "top", fill: "#EF4444", fontSize: 11 }} />
            <Bar dataKey="utilization" radius={[0, 6, 6, 0]}>
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
