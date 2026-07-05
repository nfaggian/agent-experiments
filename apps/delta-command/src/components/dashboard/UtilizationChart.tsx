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
import { CHART_GRID, CHART_TICK, CHART_TOOLTIP_STYLE } from "@/core/utils";

interface UtilizationChartProps {
  engineers: Engineer[];
  maxVisible?: number;
}

function getBarColor(utilization: number): string {
  if (utilization >= 100) return "#EF4444";
  if (utilization >= 85) return "#F59E0B";
  if (utilization >= 60) return "#3B82F6";
  return "#10B981";
}

export function UtilizationChart({ engineers, maxVisible = 30 }: UtilizationChartProps) {
  const data = [...engineers]
    .sort((a, b) => b.utilization - a.utilization)
    .slice(0, maxVisible)
    .map((e) => ({
      name: e.name.split(" ")[0],
      utilization: e.utilization,
      fill: getBarColor(e.utilization),
    }));

  const chartHeight = Math.min(520, Math.max(224, data.length * 22));

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="title-lg">Team Utilization</h3>
        <p className="text-xs text-surface-on-variant tabular">
          {engineers.length > maxVisible ? `top ${maxVisible} by %` : `${engineers.length} engineers`}
        </p>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: chartHeight }}>
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" barSize={12} margin={{ top: 12, right: 4, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={CHART_GRID} horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 120]}
                tick={{ fontSize: 11, fill: CHART_TICK }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: CHART_TICK }}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <Tooltip
                cursor={{ fill: "rgb(255 255 255 / 0.03)" }}
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value: number) => [`${value}%`, "Utilization"]}
              />
              <ReferenceLine
                x={100}
                stroke="#EF4444"
                strokeDasharray="3 3"
                strokeOpacity={0.6}
                label={{ value: "100%", position: "top", fill: "#EF4444", fontSize: 10 }}
              />
              <Bar dataKey="utilization" radius={[0, 2, 2, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
